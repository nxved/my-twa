import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "@ton/core";

export default class TestContract implements Contract {


   static createForDeploy(code: Cell, initialCounterValue: number): TestContract {
      const data = beginCell()
         .storeUint(initialCounterValue, 64)
         .endCell();
      const workchain = 0; // deploy to workchain 0
      const address = Address.parse("kQDiDPSQvkssj9EtqlJqQHV1Mnh8jUN79Tj-vjLYp60q181O");
      return new TestContract(address, { code, data });
   }

   constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) { }

   async sendDeploy(provider: ContractProvider, via: Sender) {
      await provider.internal(via, {
         value: "0.01", // send 0.01 TON to contract for rent
         bounce: false
      });
   }

   async sendMint(provider: ContractProvider, via: Sender) {
      const messageBody = beginCell().storeUint(0, 32).storeStringTail("Mint").endCell();

      await provider.internal(via, {
         value: "0.1", // send 0.002 TON for gas
         body: messageBody
      });
   }
   async sendIncrement(provider: ContractProvider, via: Sender) {
      const messageBody = beginCell()
         .storeUint(1, 32) // op (op #1 = increment)
         .storeUint(0, 64) // query id
         .endCell();
      await provider.internal(via, {
         value: "0.002", // send 0.002 TON for gas
         body: messageBody
      });
   }


   async sendWhitelist(provider: ContractProvider, via: Sender) {
      const messageBody = beginCell().storeStringTail("AddToWhitelist").storeAddress(Address.parse('EQDSjuCyZ_w_79JSNJ0YopGXpZGyP9HIYDSxBrelcTRyqYZH')).endCell();
      await provider.internal(via, {
         value: "0.002", // send 0.002 TON for gas
         body: messageBody
      });
   }

   async getCounter(provider: ContractProvider) {
      const { stack } = await provider.get("counter", []);
      return stack.readBigNumber();
   }
}