import "./App.css";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { useTonConnect } from "./hooks/useTonConnect";
import { useCounterContract } from "./hooks/useCounterContract";
import React, { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { beginCell, toNano } from "@ton/ton";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import TonWeb from "tonweb";
import { Cell, Address, storeMessage, TonClient } from "@ton/ton";

export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; delay: number }
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < options.retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Error) {
        lastError = e;
      }
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }
  throw lastError;
}

function App() {
  const body = beginCell()
    .storeUint(0, 32)
    .storeStringTail("Comment-" + "transactionID")
    .endCell();
  const defaultTx = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: "0QA9zIjreqJD-R-kP-v3caB9G3AWT8PxZJjQRo5KsYTKDXIs",
        amount: toNano(0.055).toString(),
        payload: body.toBoc().toString("base64"),
      },
    ],
  };
  const { value, address, sendMint } = useCounterContract();
  const userFriendlyAddress = useTonAddress();

  const [transactionId, setTransactionId] = useState(null);
  const [transactionIdJetton, setTransactionIdJetton] = useState(null);
  const [tx, setTx] = useState(null);
  const [txJetton, setTxJetton] = useState(null);
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const userId = "12345"; // Replace with actual user ID

  const gasAmount = toNano(0.005 + 0.05).toString();
  const tonweb = new TonWeb(
    new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
      apiKey:
        "ee4932cfad83e615d5fbce60547a1c8acfc5a553f7b216747c7139cc17069464",
    })
  );

  async function getTxByBOC(exBoc: string): Promise<string> {
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey:
        "ee4932cfad83e615d5fbce60547a1c8acfc5a553f7b216747c7139cc17069464", // https://t.me/tonapibot
    });

    // const myAddress = Address.parse('INSERT TON WALLET ADDRESS'); // Address to fetch transactions from

    return retry(
      async () => {
        const transactions = await client.getTransactions(
          Address.parse(userFriendlyAddress),
          {
            limit: 5,
          }
        );
        for (const tx of transactions) {
          const inMsg = tx.inMessage;
          if (inMsg?.info.type === "external-in") {
            const inBOC = inMsg?.body;
            if (typeof inBOC === "undefined") {
              throw new Error("Invalid external");
            }
            const extHash = Cell.fromBase64(exBoc).hash().toString("hex");
            const inHash = beginCell()
              .store(storeMessage(inMsg))
              .endCell()
              .hash()
              .toString("hex");

            console.log(" hash BOC", extHash);
            console.log("inMsg hash", inHash);
            console.log("checking the tx", tx, tx.hash().toString("hex"));

            // Assuming `inBOC.hash()` is synchronous and returns a hash object with a `toString` method
            if (extHash === inHash) {
              console.log("Tx match");
              const txHash = tx.hash().toString("hex");
              console.log(`Transaction Hash: ${txHash}`);
              console.log(`Transaction LT: ${tx.lt}`);
              return txHash;
            }
          }
        }
        throw new Error("Transaction not found");
      },
      { retries: 30, delay: 1000 }
    );
  }
  // Create and send transaction details to the backend
  const createTransaction = async () => {
    const newTransactionId = uuidv4();
    setTransactionId(newTransactionId);

    const body = beginCell()
      .storeUint(0, 32)
      .storeStringTail("Comment-" + newTransactionId)
      .endCell();

    const defaultTx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: "0QA9zIjreqJD-R-kP-v3caB9G3AWT8PxZJjQRo5KsYTKDXIs",
          amount: toNano(0.055).toString(),
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    setTx(defaultTx);

    // const response = await fetch("/api/storeTransactionId", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     userId,
    //     transactionId: newTransactionId,
    //     messageId: defaultTx.messages[0].address,
    //     amount: toNano(0.005),
    //     walletAddress: wallet.address,
    //     recipientAddress: defaultTx.messages[0].address,
    //     payload: body.toBoc().toString("base64"),
    //     validUntil: defaultTx.validUntil,
    //   }),
    // });

    // if (response.ok) {
    //   return true;
    // } else {
    //   toast.error(
    //     <Mesg
    //       title={"Error"}
    //       desc={
    //         "There was an error processing your transaction. Please try again."
    //       }
    //     />,
    //     {
    //       icon: false,
    //       autoClose: 2000,
    //       hideProgressBar: true,
    //       closeOnClick: true,
    //       pauseOnHover: true,
    //       draggable: true,
    //       progress: undefined,
    //       theme: "colored",
    //     }
    //   );
    //   return false;
    // }
  };

  const createTransactionJetton = async () => {
    const newTransactionId = uuidv4();
    setTransactionIdJetton(newTransactionId);

    const destinationAddress = Address.parse(
      "0QA9zIjreqJD-R-kP-v3caB9G3AWT8PxZJjQRo5KsYTKDXIs"
    );

    const forwardPayload = beginCell()
      .storeUint(0, 32)
      .storeStringTail("This will be comment from Backend!")
      .endCell();

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(toNano(50))
      .storeAddress(destinationAddress)
      .storeAddress(destinationAddress)
      .storeBit(0) // no custom payload
      .storeCoins(toNano(0.02))
      .storeBit(1)
      .storeRef(forwardPayload)
      .endCell();

    const defaultTx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address:
            "0:FB240673F524EB6ACFFA02764C2AEFA002047E1A39AE23F68BE7400D036F6832",
          amount: toNano(0.05).toString(),
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    setTxJetton(defaultTx);

    // const response = await fetch("/api/storeTransactionId", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     userId,
    //     transactionId: newTransactionId,
    //     messageId: defaultTx.messages[0].address,
    //     amount: toNano(0.005),
    //     walletAddress: wallet.address,
    //     recipientAddress: defaultTx.messages[0].address,
    //     payload: body.toBoc().toString("base64"),
    //     validUntil: defaultTx.validUntil,
    //   }),
    // });

    // if (response.ok) {
    //   return true;
    // } else {
    //   toast.error(
    //     <Mesg
    //       title={"Error"}
    //       desc={
    //         "There was an error processing your transaction. Please try again."
    //       }
    //     />,
    //     {
    //       icon: false,
    //       autoClose: 2000,
    //       hideProgressBar: true,
    //       closeOnClick: true,
    //       pauseOnHover: true,
    //       draggable: true,
    //       progress: undefined,
    //       theme: "colored",
    //     }
    //   );
    //   return false;
    // }
  };

  // Handle transaction process
  const handleTransaction = async () => {
    console.log("--------------------------------------------");
    const success = await createTransaction();
    if (wallet) {
      const response = await tonConnectUI.sendTransaction(tx);
      console.log(response);
      console.log("Transaction response:", response);
      const bocCell = tonweb.boc.Cell.oneFromBoc(
        tonweb.utils.base64ToBytes(response.boc)
      );

      const hash = tonweb.utils.bytesToBase64(await bocCell.hash());
      console.log("Transaction Hash:", hash);

      const txRes = await getTxByBOC(response.boc);
      console.log("Response", txRes);
      // const statusResponse = await fetch(
      //   `/api/checkTransactionStatus?transactionId=${transactionId}`
      // );
      // const statusData = await statusResponse.json();
    }
  };

  const handleTransactionJetton = async () => {
    const newTransactionId = uuidv4();
    setTransactionIdJetton(newTransactionId);

    const destinationAddress = Address.parse(
      "0QA9zIjreqJD-R-kP-v3caB9G3AWT8PxZJjQRo5KsYTKDXIs"
    );

    const forwardPayload = beginCell()
      .storeUint(0, 32)
      .storeStringTail("This will be comment from Backend!")
      .endCell();

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(toNano(5000))
      .storeAddress(destinationAddress)
      .storeAddress(destinationAddress)
      .storeBit(0) // no custom payload
      .storeCoins(1)
      .storeBit(1)
      .storeRef(forwardPayload)
      .endCell();

    const defaultTx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address:
            "0:FB240673F524EB6ACFFA02764C2AEFA002047E1A39AE23F68BE7400D036F6832",
          amount: toNano(0.05).toString(),
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    setTxJetton(defaultTx);

    console.log("--------------------------------------------");
    const success = await createTransaction();
    if (wallet) {
      const response = await tonConnectUI.sendTransaction(defaultTx);
      console.log(response);
      console.log("Transaction response:", response);
      const bocCell = tonweb.boc.Cell.oneFromBoc(
        tonweb.utils.base64ToBytes(response.boc)
      );

      const hash = tonweb.utils.bytesToBase64(await bocCell.hash());
      console.log("Transaction Hash:", hash);

      const txRes = await getTxByBOC(response.boc);
      console.log("Response", txRes);
      // const statusResponse = await fetch(
      //   `/api/checkTransactionStatus?transactionId=${transactionId}`
      // );
      // const statusData = await statusResponse.json();
    }
  };

  return (
    <div className="App">
      <div className="Container">
        <TonConnectButton />

        <div className="Card">
          <b>Contract Address</b>
          <div className="Hint">{address?.slice(0, 30) + "..."}</div>
        </div>

        {/* <div className='Card'>
          <b>Counter Value</b>
          <div>{value ?? 'Loading...'}</div>
        </div> */}

        <a
          className={`Button`}
          onClick={() => {
            sendMint();
          }}
        >
          Mint
        </a>
      </div>
      <div className="send-tx-form">
        <TonConnectButton />
        {wallet ? (
          <>
            <button onClick={handleTransaction}>Send Transaction</button>
            <button onClick={handleTransactionJetton}>Send Jetton</button>
          </>
        ) : (
          <button onClick={() => tonConnectUI.openModal()}>
            Connect Wallet
          </button>
        )}
      </div>
      <button onClick={() => tonConnectUI.sendTransaction(defaultTx)}>
        New transaction
      </button>
    </div>
  );
}

export default App;
