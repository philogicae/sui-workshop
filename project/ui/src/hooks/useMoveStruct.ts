import { useSuiClientQuery } from "@mysten/dapp-kit";

export function useMoveStruct<T>(objectId: string, options?: Parameters<typeof useSuiClientQuery>[2]) {
  const result = useSuiClientQuery("getObject", {
    id: objectId,
    options: {
      showContent: true,
      ...options,
    },
  });

  const data = result.data?.data?.content?.dataType === "moveObject"
    ? (result.data.data.content.fields as T)
    : null;

  return { ...result, data } as typeof result & { data: T | null };
}
