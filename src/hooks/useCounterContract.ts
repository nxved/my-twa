import { useEffect, useState } from 'react';
import TestContract from '../contracts/counter';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address, OpenedContract } from '@ton/core';
import { useTonConnectUI } from '@tonconnect/ui-react';



export function useCounterContract() {
   const client = useTonClient();
   const [val, setVal] = useState<null | string>();
   const { sender } = useTonConnect();
   const [tonConnectUI] = useTonConnectUI();


   const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

   const counterContract = useAsyncInitialize(async () => {
      if (!client) return;
      const contract = new TestContract(
         Address.parse('EQC3bD7V2jEa4DOmwq6Bdso-Z-DQk2BJfE_y8c8mGgz87f_6') // replace with your address from tutorial 2 step 8
      );
      return client.open(contract) as OpenedContract<TestContract>;
   }, [client]);

   // useEffect(() => {
   //    async function getValue() {
   //       if (!counterContract) return;
   //       setVal(null);
   //       const val = await counterContract.getCounter();
   //       setVal(val.toString());
   //       await sleep(5000); // sleep 5 seconds and poll value again
   //       getValue();
   //    }
   //    getValue();
   // }, [counterContract]);
   return {
      value: val,
      address: counterContract?.address.toString(),
      sendMint: () => {
         const tx = counterContract?.sendMint(sender);
         console.log(tx)
         return tx;
      },
   };
}
