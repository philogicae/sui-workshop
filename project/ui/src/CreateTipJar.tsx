import { Transaction } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type {
  OwnedObjectRef,
  SuiTransactionBlockResponse,
  WaitForTransactionBlockResponse,
} from "@mysten/sui/client";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function CreateTipJar({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const tipJarPackageId = useNetworkVariable("tipJarPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [waitingForTxn, setWaitingForTxn] = useState(false);

  const create = () => {
    if (!tipJarPackageId) {
      return;
    }

    setWaitingForTxn(true);

    const tx = new Transaction();

    tx.moveCall({
      target: `${tipJarPackageId}::tip_jar::init`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (txResult: SuiTransactionBlockResponse) => {
          suiClient
            .waitForTransaction({ digest: txResult.digest, options: { showEffects: true } })
            .then((result: WaitForTransactionBlockResponse) => {
              const createdShared = result.effects?.created?.find(
                (item): item is OwnedObjectRef =>
                  "reference" in item &&
                  item.reference.objectType.includes("::tip_jar::TipJar")
              );

              const objectId = createdShared?.reference?.objectId;

              if (objectId) {
                onCreated(objectId);
              }
            })
            .finally(() => {
              setWaitingForTxn(false);
            });
        },
        onError: () => {
          setWaitingForTxn(false);
        },
      },
    );
  };

  return (
    <Container>
      <Button
        size="3"
        onClick={() => {
          create();
        }}
        disabled={waitingForTxn || !tipJarPackageId}
      >
        {waitingForTxn ? <ClipLoader size={20} /> : "Create Tip Jar"}
      </Button>
    </Container>
  );
}
