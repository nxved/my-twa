import './App.css';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from './hooks/useTonConnect';
import { useCounterContract } from './hooks/useCounterContract';

function App() {
  const { connected } = useTonConnect();
  const { value, address, sendMint } = useCounterContract();

  return (
    <div className='App'>
      <div className='Container'>
        <TonConnectButton />

        <div className='Card'>
          <b>Contract Address</b>
          <div className='Hint'>{address?.slice(0, 30) + '...'}</div>
        </div>

        {/* <div className='Card'>
          <b>Counter Value</b>
          <div>{value ?? 'Loading...'}</div>
        </div> */}

        <a
          className={`Button ${connected ? 'Active' : 'Disabled'}`}
          onClick={() => {
            sendMint();
          }}
        >
          Mint
        </a>
      </div>
    </div>
  );
}

export default App
