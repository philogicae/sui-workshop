import { getFullnodeUrl } from "@mysten/sui/client";
import {
  TESTNET_HELLO_WORLD_PACKAGE_ID,
  TESTNET_TIP_JAR_PACKAGE_ID,
  TESTNET_GUESTBOOK_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        helloWorldPackageId: TESTNET_HELLO_WORLD_PACKAGE_ID,
        tipJarPackageId: TESTNET_TIP_JAR_PACKAGE_ID,
        guestbookPackageId: TESTNET_GUESTBOOK_PACKAGE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
