import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import type { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextArea } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMoveStruct } from "./hooks/useMoveStruct";

const MESSAGE_MAX_LENGTH = 100;

type MoveString =
  | string
  | {
      bytes?: string;
      fields?: {
        bytes?: string;
      };
    }
  | {
      fields?: {
        bytes?: string;
      };
    };

type RawMessage =
  | {
      sender?: string;
      content?: MoveString;
      fields?: RawMessage;
    }
  | {
      fields: {
        sender: string;
        content: MoveString;
      };
    };

type GuestbookFields = {
  total_messages: string;
  messages: RawMessage[];
};

function normaliseMessage(raw: RawMessage) {
  const payload = "fields" in raw && raw.fields ? raw.fields : raw;
  const sender = typeof payload.sender === "string" ? payload.sender : "";
  const content = decodeMoveString(payload.content);

  return { sender, content };
}

function decodeMoveString(value: MoveString | undefined): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const bytesCandidate =
    value.fields?.bytes ?? ("bytes" in value ? value.bytes : undefined);

  if (!bytesCandidate) {
    return "";
  }

  return hexToUtf8(bytesCandidate);
}

function hexToUtf8(hex: string) {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleaned.length === 0) {
    return "";
  }

  const matches = cleaned.match(/.{1,2}/g);
  if (!matches) {
    return "";
  }

  const bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));

  try {
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error("Failed to decode Move string", error);
    return "";
  }
}

export function Guestbook({ id }: { id: string }) {
  const guestbookPackageId = useNetworkVariable("guestbookPackageId");
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { data, isPending, error, refetch } = useMoveStruct<GuestbookFields>(id);

  const [message, setMessage] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const messages = useMemo(() => {
    if (!data?.messages) {
      return [] as Array<{ sender: string; content: string }>;
    }

    return data.messages.map(normaliseMessage).reverse();
  }, [data?.messages]);

  const messageCount = useMemo(() => {
    if (!data?.total_messages) {
      return 0;
    }

    return Number(data.total_messages);
  }, [data?.total_messages]);

  const remainingCharacters = MESSAGE_MAX_LENGTH - message.length;

  const submitMessage = () => {
    if (!guestbookPackageId || !currentAccount) {
      setValidationMessage("Connect your wallet to post a message.");
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setValidationMessage("Message cannot be empty.");
      return;
    }

    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      setValidationMessage(`Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setValidationMessage(null);
    setWaitingForTxn(true);

    const tx = new Transaction();
    const guestbookObj = tx.object(id);
    const messageStruct = tx.moveCall({
      target: `${guestbookPackageId}::guestbook::create_message`,
      arguments: [
        tx.pure.address(currentAccount.address),
        tx.pure.string(trimmed),
      ],
    });

    tx.moveCall({
      target: `${guestbookPackageId}::guestbook::post_message`,
      arguments: [guestbookObj, messageStruct],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (txResult: SuiTransactionBlockResponse) => {
          suiClient
            .waitForTransaction({ digest: txResult.digest })
            .then(async () => {
              await refetch();
              setMessage("");
              setWaitingForTxn(false);
            })
            .catch(() => {
              setWaitingForTxn(false);
            });
        },
        onError: () => {
          setWaitingForTxn(false);
        },
      },
    );
  };

  if (isPending) return <Text>Loading guestbook...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!data) return <Text>Guestbook not found.</Text>;

  return (
    <Flex direction="column" gap="3">
      <Heading size="3">Guestbook {id}</Heading>
      <Text>Total messages: {messageCount}</Text>

      <Flex direction="column" gap="2">
        <TextArea
          placeholder="Leave a message"
          value={message}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(event.target.value);
          }}
          disabled={waitingForTxn}
          style={{ minHeight: 120 }}
        />
        <Flex justify="between" align="center">
          <Text size="2" color={remainingCharacters < 0 ? "red" : undefined}>
            {remainingCharacters} characters remaining
          </Text>
          <Button onClick={submitMessage} disabled={waitingForTxn || !guestbookPackageId}>
            {waitingForTxn ? <ClipLoader size={20} /> : "Post message"}
          </Button>
        </Flex>
        {validationMessage ? <Text color="red">{validationMessage}</Text> : null}
      </Flex>

      <Flex direction="column" gap="2" mt="3">
        {messages.length === 0 ? (
          <Text size="2" color="gray">
            No messages yet. Be the first to post!
          </Text>
        ) : (
          messages.map((item, index) => (
            <Flex
              key={`${item.sender}-${index}`}
              direction="column"
              gap="1"
              style={{
                border: "1px solid var(--gray-a5)",
                borderRadius: "var(--radius-3)",
                padding: "12px",
                background: "var(--gray-a2)",
              }}
            >
              <Text size="1" color="gray">
                From: {item.sender}
              </Text>
              <Text>{item.content || "(empty message)"}</Text>
            </Flex>
          ))
        )}
      </Flex>
    </Flex>
  );
}
