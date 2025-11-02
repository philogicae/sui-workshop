import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useEffect, useMemo, useState } from "react";
import { Greeting } from "./Greeting";
import { CreateGreeting } from "./CreateGreeting";
import { CreateTipJar } from "./CreateTipJar";
import { TipJar } from "./TipJar";
import { Guestbook } from "./Guestbook";
import { CreateGuestbook } from "./CreateGuestbook";

function App() {
	const currentAccount = useCurrentAccount();
	const [greetingId, setGreeting] = useState(() => {
		const hash = window.location.hash.slice(1);
		return isValidSuiObjectId(hash) ? hash : null;
	});
	const [tipJarId, setTipJarId] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		const tipJarParam = params.get("tipJarId") || "0x219e6fa7d0fe791e0b7addce2215ff7e4fa271057694c7bc5db516eb76d66ef3";
		return tipJarParam && isValidSuiObjectId(tipJarParam) ? tipJarParam : null;
	});
	const [guestbookId, setGuestbookId] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		const guestbookParam = params.get("guestbookId") || "0xc6aba638eacdd6cd5a05766d6d81a83f96b90b97df844599732306b977234095";
		return guestbookParam && isValidSuiObjectId(guestbookParam) ? guestbookParam : null;
	});

	useEffect(() => {
		if (!tipJarId) {
			return;
		}
		updateTipJarParam(tipJarId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!guestbookId) {
			return;
		}
		updateGuestbookParam(guestbookId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const tipJarIdLabel = useMemo(() => tipJarId ?? "(none)", [tipJarId]);
	const guestbookIdLabel = useMemo(() => guestbookId ?? "(none)", [guestbookId]);

	const updateTipJarParam = (id: string | null) => {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set("tipJarId", id);
		} else {
			url.searchParams.delete("tipJarId");
		}
		window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
		setTipJarId(id);
	};

	const updateGuestbookParam = (id: string | null) => {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set("guestbookId", id);
		} else {
			url.searchParams.delete("guestbookId");
		}
		window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
		setGuestbookId(id);
	};

	const tipJarLoaded = useMemo(() => Boolean(tipJarId), [tipJarId]);
	const guestbookLoaded = useMemo(() => Boolean(guestbookId), [guestbookId]);

	return (
		<>
			<Flex
				position="sticky"
				px="4"
				py="2"
				justify="between"
				align={"center"}
				style={{
					borderBottom: "1px solid var(--gray-a2)",
				}}
			>
				<Box>
					<Heading>dApp Starter Template</Heading>
				</Box>

				<Box style={{ display: "flex", gap: 10, alignItems: "center" }}>
					{currentAccount && (
						<Button
							variant="soft"
							onClick={() => {
								window.open(
									`https://faucet.sui.io/?address=${currentAccount.address}`,
									"_blank",
								);
							}}
						>
							Get Testnet SUI
						</Button>
					)}
					<ConnectButton />
				</Box>
			</Flex>
			<Container>
				<Flex direction="column" gap="4" mt="5">
					<Container pt="2" px="4" style={{ background: "var(--gray-a2)", minHeight: 320 }}>
						<Heading size="4" mb="3">
							Hello World Greeting
						</Heading>
						{currentAccount ? (
							greetingId ? (
								<Greeting id={greetingId} />
							) : (
								<CreateGreeting
									onCreated={(id) => {
										window.location.hash = id;
										setGreeting(id);
									}}
								/>
							)
						) : (
							<Heading>Please connect your wallet</Heading>
						)}
					</Container>
					<Container pt="2" px="4" style={{ background: "var(--gray-a2)", minHeight: 320 }}>
						<Heading size="4" mb="3">
							Tip Jar
						</Heading>
						{currentAccount ? (
							tipJarLoaded ? (
								<Flex direction="column" gap="3">
									<Text size="2">Current tip jar: {tipJarIdLabel}</Text>
									<TipJar id={tipJarId!} />
									<Button
										variant="ghost"
										onClick={() => {
											updateTipJarParam(null);
										}}
									>
										Use a different tip jar
									</Button>
								</Flex>
							) : (
								<CreateTipJar
									onCreated={(id) => {
										updateTipJarParam(id);
									}}
								/>
							)
						) : (
							<Heading>Please connect your wallet</Heading>
						)}
					</Container>
					<Container pt="2" px="4" style={{ background: "var(--gray-a2)", minHeight: 320 }}>
						<Heading size="4" mb="3">
							Guestbook
						</Heading>
						{currentAccount ? (
							guestbookLoaded ? (
								<Flex direction="column" gap="3">
									<Text size="2">Current guestbook: {guestbookIdLabel}</Text>
									<Guestbook id={guestbookId!} />
									<Button
										variant="ghost"
										onClick={() => {
											updateGuestbookParam(null);
										}}
									>
										Use a different guestbook
									</Button>
								</Flex>
							) : (
								<CreateGuestbook
									onCreated={(id) => {
										updateGuestbookParam(id);
									}}
								/>
							)
						) : (
							<Heading>Please connect your wallet</Heading>
						)}
					</Container>
				</Flex>
			</Container>
		</>
	);
}

export default App;
