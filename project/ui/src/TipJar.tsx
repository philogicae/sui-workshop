import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

const MIST_PER_SUI = 1_000_000_000n;

function formatSui(amountInMist: bigint) {
  const whole = amountInMist / MIST_PER_SUI;
  const fraction = amountInMist % MIST_PER_SUI;

  if (fraction === 0n) {
    return `${whole.toString()} SUI`;
  }

  const fractionStr = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fractionStr} SUI`;
}

function parseAmountToMist(amount: string): bigint | null {
  const normalized = amount.trim();

  if (!normalized) {
    return null;
  }

  if (!/^\d*(\.\d{0,9})?$/.test(normalized)) {
    return null;
  }

  const [wholePart = "0", decimalPart = ""] = normalized.split(".");
  const whole = BigInt(wholePart || "0");
  const paddedDecimal = (decimalPart + "000000000").slice(0, 9);
  const decimal = BigInt(paddedDecimal || "0");

  return whole * MIST_PER_SUI + decimal;
}

export function TipJar({ id }: { id: string }) {
  const tipJarPackageId = useNetworkVariable("tipJarPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
    },
  });

  const [tipAmount, setTipAmount] = useState("1");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();

  const fields = useMemo(() => {
    if (!data?.data) {
      return null;
    }

    return getTipJarFields(data.data);
  }, [data?.data]);

  const totalTips = useMemo(() => {
    if (!fields) {
      return 0n;
    }

    return BigInt(fields.total_tips_received);
  }, [fields]);

  const tipCount = useMemo(() => {
    if (!fields) {
      return 0;
    }

    return Number(fields.tip_count);
  }, [fields]);

  const averageTip = useMemo(() => {
    if (tipCount === 0) {
      return 0n;
    }

    return totalTips / BigInt(tipCount);
  }, [tipCount, totalTips]);

  const isOwner = useMemo(() => {
    if (!fields || !currentAccount) {
      return false;
    }

    return fields.owner.toLowerCase() === currentAccount.address.toLowerCase();
  }, [currentAccount, fields]);

  const tip = () => {
    if (!tipJarPackageId) {
      return;
    }

    const tipInMist = parseAmountToMist(tipAmount);

    if (!tipInMist || tipInMist === 0n) {
      setValidationMessage("Enter a valid amount (up to 9 decimal places).");
      return;
    }

    setValidationMessage(null);
    setWaitingForTxn(true);

    const tx = new Transaction();
    const [tipCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(tipInMist)]);

    tx.moveCall({
      target: `${tipJarPackageId}::tip_jar::send_tip`,
      arguments: [tx.object(id), tipCoin],
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
              setWaitingForTxn(false);
              setTipAmount("1");
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

  if (isPending) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!fields) return <Text>Tip jar not found.</Text>;

  return (
    <Flex direction="column" gap="3">
      <Heading size="3">Tip Jar {id}</Heading>
      <Flex direction="column" gap="1">
        <Text>Owner: {fields.owner}</Text>
        {isOwner ? <Text color="green">You own this tip jar.</Text> : null}
        <Text>Total tips received: {formatSui(totalTips)}</Text>
        <Text>Total tips count: {tipCount}</Text>
        <Text>
          Average tip size: {tipCount === 0 ? "N/A" : formatSui(averageTip)}
        </Text>
      </Flex>
      <Flex direction="row" gap="2" align="center">
        <TextField.Root
          placeholder="Amount in SUI"
          value={tipAmount}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setTipAmount(event.target.value)}
          disabled={waitingForTxn}
        />
        <Button onClick={() => tip()} disabled={waitingForTxn || !tipJarPackageId}>
          {waitingForTxn ? <ClipLoader size={20} /> : "Leave a tip"}
        </Button>
      </Flex>
      {validationMessage ? <Text color="red">{validationMessage}</Text> : null}
    </Flex>
  );
}

function getTipJarFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  return data.content.fields as unknown as {
    total_tips_received: string;
    tip_count: string;
    owner: string;
  };
}
