import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Wallet from './Wallet'; 
import LoadingModal from './LoadingModal';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const walletRef = useRef(null); // Creating a reference for the wallet section
  const [isLoading, setIsLoading] = useState(false);


  // Function to fetch portfolio data from the API
  const fetchPortfolioData = async () => {
    if (!walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
      alert('Invalid wallet address format.');
      return;
    }

    const apiUrl = `https://public-api.birdeye.so/v1/wallet/token_list?wallet=${walletAddress}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': '755089198a7140aa9f5bf0dd9ba84c18',
        'x-chain': 'solana'
      }
    });


    if (response.ok) {
      const jsonResponse = await response.json();
      if (jsonResponse.success) {
        const filteredItems = jsonResponse.data.items.filter(item => item.valueUsd != null);
        jsonResponse.data.items = filteredItems;
        console.log(jsonResponse.data)
        setPortfolioData(jsonResponse.data);
      } else {
        console.error('API responded with success: false');
      }
    } else {
      console.error('HTTP error: ', response.status);
    }
    
  };

    // Function to fetch transaction data from the API
    const fetchTransactionData = async () => {
      if (!walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        alert('Invalid wallet address format.');
        return;
      }
      const apiUrl = `https://public-api.birdeye.so/v1/wallet/tx_list?wallet=${walletAddress}`;

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-API-KEY': '755089198a7140aa9f5bf0dd9ba84c18',
            'x-chain': 'solana'
          }
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        if (data.success) {
          setTransactionData(calculateSOLPerformance(data.data.solana));
        } else {
          console.error('API responded with success: false');
        }
      } catch (error) {
        console.error('Error fetching transaction data: ', error.message);
      }
    };


    function calculateSOLPerformance(transactions) {
      const solPerformance = {};
    
      transactions.forEach(tx => {
        let solChange = 0;
        let tokenData = {};
    
        tx.balanceChange.forEach(change => {
          if (change.symbol === "SOL") {
            solChange = change.amount;
          } else {
            tokenData = {
              symbol: change.symbol,
              logoURI: change.logoURI
            };
          }
        });
    
        if (tokenData.symbol && !tokenData.symbol.startsWith("USD") && !tokenData.symbol.startsWith("WSOL")) {
          const tokenName = tokenData.symbol;
    
          if (!solPerformance[tokenName]) {
            solPerformance[tokenName] = { buys: 0, sells: 0, net: 0, logoURI: tokenData.logoURI };
          }
    
          const convertedSolChange = Math.floor(solChange / Math.pow(10, 9 - 3)) / 1000;
    
          if (solChange < 0) {
            solPerformance[tokenName].buys += Math.abs(convertedSolChange);
          } else if (solChange > 0) {
            solPerformance[tokenName].sells += convertedSolChange;
          }
    
          solPerformance[tokenName].net += convertedSolChange;
        }
      });
    
      // Filter out tokens with only buys and no sells
      Object.keys(solPerformance).forEach(token => {
        if (solPerformance[token].sells === 0 && solPerformance[token].buys > 0) {
          delete solPerformance[token];
        }
      });
      
      const sortedTokens = Object.entries(solPerformance)
      .sort((a, b) => b[1].net - a[1].net);
  
    // Tag the best and worst plays (assuming there are at least two tokens)
    if (sortedTokens.length > 1) {
      const bestPlay = sortedTokens[0][0]; // The token with the highest net
      const worstPlay = sortedTokens[sortedTokens.length - 1][0]; // The token with the lowest net
      solPerformance[bestPlay].tag = 'Best Play';
      solPerformance[worstPlay].tag = 'Worst Play';
    }
    
      // Calculate total SOL change from the filtered solPerformance data
      let totalSOLChange = Object.values(solPerformance).reduce((acc, token) => acc + token.net, 0);
    
      console.log({ performance: solPerformance, totalSOLChange });

      return { performance: solPerformance, totalSOLChange };
    }
    

  useEffect(() => {
    if (portfolioData && walletRef.current) {
      walletRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [portfolioData]);

  const fetchData = async () => {
    setIsLoading(true);
    await fetchTransactionData();
    await fetchPortfolioData();
    setIsLoading(false);
  };



  return (
    <div className="App">
      {isLoading && <LoadingModal />}
      <header className="App-header">
        <h1>SHITFOLIO</h1>
        <img src="/shitfolio.png" className="App-logo" alt="logo" />
        <p>Ever wondered how you did with your shitcoin gambles? <br></br></p>
        <p style={{fontSize: "1vw"}} >The Statistics data is based on your last 100 transactions. <br></br> SOL Change is calculated with buys and sells, if you interacted with them differently it might be incorrect.</p>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter your wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <button onClick={fetchData} disabled={!walletAddress}>Fetch Data</button>
        </div>
      </header>
      
        <main ref={walletRef}>
          {portfolioData && transactionData ? (
            <Wallet data={portfolioData} transactionData={transactionData} />
          ) : ( null
          )}
        </main>

    </div>
    
  );
}

export default App;
