import React, { useState, useEffect, useRef } from 'react';
import '../design/Memefolio.css';
import UserStatistics from './UserStatistics'; // Import the Statistics component
import LoadingModal from '../widgets/loadingModal';
import * as web3 from '@solana/web3.js';


/// TODO: BAZI WALLETLARI KULLANDIRTMAMA,SCROLL KISMI, GENEL BİR GÖRSEL DÜZENLEME ,DOCUMENTATION,

function Memefolio() {
  const [transactionsData, settransactionsData] = useState(null);
  const [weeklyData, setweeklyData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isValidAddress, setisValidAddress] = useState(false);
  const walletRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState("please connect wallet");
  const [buttonLogic, setButtonLogic] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(null);

  const rpcEndpoint = 'https://mainnet.helius-rpc.com/?api-key=1a8b4527-6ec2-4036-acd8-e747259d7654';

  const connectWallet = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet extension not detected');
      return;
    }

    try {
      // Connect to Phantom wallet
      await window.solana.connect();
      setWalletConnected(true);

      // Get the user's public key (wallet address)
      const publicKey = window.solana.publicKey;

      console.log(publicKey)

      // Fetch balance
      const connection = new web3.Connection(rpcEndpoint);
      console.log(connection)

      try {
        const tokenBalances = await connection.getParsedTokenAccountsByOwner(publicKey,{
          mint: new web3.PublicKey("CAHERE")
      });
        setBalance((tokenBalances.value[0].account.data.parsed.info.tokenAmount.uiAmount).toFixed(2));

      } catch (error) {
        setBalance(0);
        
      }
      setWalletAddress(publicKey.toString())
    } catch (error) {
      console.error('Failed to connect to wallet:', error);

    }
  };


  async function calculateSolDiff() {
    const url = "https://rest-api.hellomoon.io/v0/solana/txns-by-user";
    const headers = {
        'accept': 'application/json',
        'authorization': 'Bearer b37676d0-bb3b-471d-b0fb-31917a1d6593',
        'content-type': 'application/json'
    };

    const payload = {
        "blockTime": {
            "operator": "between",
            "greaterThan": 0,
            "lessThan": 100000000000000
        },
        "userAccount": `${walletAddress}`,
        "type": "TOKEN_SWAP",
        "limit": 500
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const solTokenAddress = "So11111111111111111111111111111111111111112";
        const usdcTokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        let solDiffs = {};
        let allTokens = []
        let totalSolChange = 0;
        let airdropsAmount = 0;
        let holdingsAmount = 0;
        let ruggedAmount = 0;

        
        data.data.forEach(tx => {

            const sourceMint = tx.parsedInfo.sourceMint;
            const destinationMint = tx.parsedInfo.destinationMint;
            const sourceAmount = tx.parsedInfo.sourceAmount / Math.pow(10, 9);
            const destinationAmount = tx.parsedInfo.destinationAmount / Math.pow(10, 9);
            const otherMint = sourceMint === solTokenAddress ? destinationMint : sourceMint;
            if (!solDiffs[otherMint]) {
                solDiffs[otherMint] = {tokenAddress: otherMint, buy: 0, sell: 0, net: 0, txs: [], tag: "" };
            }

            let txType;
            let solChange;
            allTokens.push(otherMint)
            if (sourceMint === solTokenAddress) {
                txType = 'buy';
                solChange = sourceAmount;
                solDiffs[otherMint].buy += solChange;
                solDiffs[otherMint].net -= solChange;
                totalSolChange -= solChange;
                solDiffs[otherMint].boughtTokenAmount ? solDiffs[otherMint].boughtTokenAmount=  solDiffs[otherMint].boughtTokenAmount + destinationAmount :  solDiffs[otherMint].boughtTokenAmount= destinationAmount
            } else if (destinationMint === solTokenAddress) {
                txType = 'sell';
                solChange = destinationAmount;
                solDiffs[otherMint].sell += solChange;
                solDiffs[otherMint].net += solChange;
                totalSolChange += solChange;
                solDiffs[otherMint].soldTokenAmount ? solDiffs[otherMint].soldTokenAmount=  solDiffs[otherMint].soldTokenAmount + sourceAmount :  solDiffs[otherMint].soldTokenAmount= sourceAmount
            } else {
                return;
            }

            const transaction = {
                blockTime: new Date(tx.blockTime * 1000).toLocaleString(),
                transactionId: "https://solscan.io/tx/" + tx.transactionId,
                type: txType,
                tokenChange: txType === 'sell' ? sourceAmount * -1 : destinationAmount,
                solChange: solChange
            };

            solDiffs[otherMint].txs.push(transaction);
        });

        for (const [token, details] of Object.entries(solDiffs)) {
          if (details.buy > 0 && details.sell === 0) {
              let isRugged = await rugCheck(token);
              if (isRugged) {
                  solDiffs[token].tag = "rugged";
                  ruggedAmount += details.net;  // Sum up the amount for rugged tokens
              } else {
                  solDiffs[token].tag = "holding";
                  holdingsAmount += details.net;  // Sum up the amount for holdings
              }
          } else if (details.buy === 0 && details.sell > 0) {
              solDiffs[token].tag = "Airdrop";
              airdropsAmount += details.net;  // Sum up the amount for airdrops
          } else if(details.boughtTokenAmount > details.soldTokenAmount) {
            solDiffs[token].tag = "Partially Holding";
          } else {
              solDiffs[token].tag = "sold";
          }
      }
      let allTokensUnique = [...new Set(allTokens)];
      let tokenMetadata = await fetchTokenMetadata(allTokensUnique);
      tokenMetadata.forEach(element => {

        solDiffs[element.id].token_info = element.token_info
        solDiffs[element.id].content = element.content

    });

      // Group data by week of the year
      const groupedData = groupDataByWeekAndSort(solDiffs);
      setweeklyData(groupedData)

    let firstTxDate = solDiffs[allTokensUnique[0]].txs[0].blockTime
    let lastTxDate = solDiffs[allTokensUnique[allTokensUnique.length -1]].txs[0].blockTime


    // Filter items based on tags to be excluded
    const excludedTags = ["airdrop", "rugged", "holding"];
    const filteredData = Object.fromEntries(
      Object.entries(solDiffs).filter(([key, value]) => !excludedTags.includes(value.tag))
  );

    // Sort tokens by net from filtered data
    const sortedTokens = Object.entries(filteredData).sort((a, b) => a[1].net - b[1].net);

    if (sortedTokens.length > 0) {
        // Get token with the smallest net
        const minNetToken = sortedTokens[0];
        // Get token with the biggest net
        const maxNetToken = sortedTokens[sortedTokens.length - 1];

        solDiffs['bestPlays'] = {
          "best": maxNetToken,
          "worst": minNetToken
        }
    }




      solDiffs['data'] = {
        "totalSolChange": totalSolChange,
        "airdropsAmount": airdropsAmount,
        "holdingsAmount": holdingsAmount,
        "ruggedAmount": ruggedAmount,
        "firstTxDate": firstTxDate,
        "lastTxDate": lastTxDate
      }
        settransactionsData(solDiffs);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function rugCheck(tokenId) {
  const url = `https://price.jup.ag/v4/price?ids=${tokenId}&vsToken=So11111111111111111111111111111111111111112`;
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

              // Check if the data for the token is empty
              if (!data.data[tokenId] || Object.keys(data.data[tokenId]).length === 0) {
                return true
            } else {
              return false
            }
  } catch (error) {
      console.error("Error fetching token data:", error);
      throw error;
  }
}

// Function to group data by week of the year and sort by latest weeks
const groupDataByWeekAndSort = (data) => {
  const grouped = {};

  Object.keys(data).forEach((key) => {
      const firstTx = data[key].txs[0]; // Get the first transaction in the txs array
      const blockTime = firstTx.blockTime;
      const dateParts = blockTime.split(' ')[0].split('.');
      const formattedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      const isoWeekNumber = formattedDate ? formattedDate.getWeek() : null;

      if (isoWeekNumber) {
          if (!grouped[isoWeekNumber]) {
              grouped[isoWeekNumber] = {
                  data: [],
                  startDate: getWeekStartDate(formattedDate),
                  endDate: getWeekEndDate(formattedDate)
              };
          }
          grouped[isoWeekNumber].data.push(data[key]);
      }
  });

  // Sort the grouped data by week number (latest weeks first)
  const sortedGroups = Object.values(grouped).sort((a, b) => {
      return new Date(b.startDate) - new Date(a.startDate);
  });

  return sortedGroups;
};

// Function to get the start date of the week (Sunday) for a given date
const getWeekStartDate = (date) => {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to start of the week (Sunday)
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() + diff);
  return weekStart.toISOString().split('T')[0];
};

// Function to get the end date of the week (Saturday) for a given date
const getWeekEndDate = (date) => {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = dayOfWeek === 6 ? 0 : 6 - dayOfWeek; // Adjust to end of the week (Saturday)
  const weekEnd = new Date(date);
  weekEnd.setDate(weekEnd.getDate() + diff);
  return weekEnd.toISOString().split('T')[0];
};

// Extend Date prototype to get ISO week number
Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
      3 + (week1.getDay() + 6) % 7) / 7);
};





async function fetchTokenMetadata(data) {

  const url = `https://mainnet.helius-rpc.com/?api-key=3a2302cb-b52f-4b1d-8029-5a622a2e20cc`;
  const headers = {
    "accept": "application/json",
    "content-type": "application/json",
};

  const payload = {
    "jsonrpc": "2.0",
    "id": "my-id",
    "method": "getAssetBatch",
    "params": {
      "ids": data
    }
  }
;
let result;
  await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
  }).then(response => response.json()) // Parse the JSON response
  .then(data => {
    // Access the result from the parsed JSON data
    result = data.result;
  
  })
  return result
}



async function fetchTokensWithNonZeroBalance() {
  const url = "https://rest-api.hellomoon.io/v0/rebase/my-token-balance";
  const headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": "Bearer b37676d0-bb3b-471d-b0fb-31917a1d6593"
};

  const payload = { "ownerAccount": `${walletAddress}`};  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
  });
      const data = await response.json();

      let tokens = data.filter(token => token.amount !== "0");
      tokens = tokens.filter(token => token.amount !== "1");

      let walletData = {}
      tokens.forEach(element => {
        
        walletData[element.mint] = {
          "token_id": element.mint,
          "amount": element.amount
        }
    });
      let holdingTokens = tokens.map(item => item["mint"])
      let tokenMetadata = await fetchTokenMetadata(holdingTokens);
      tokenMetadata.forEach(element => {
        if(element.token_info.price_info !== undefined){
          walletData[element.id].token_id === "So11111111111111111111111111111111111111112" ? walletData[element.id].amount = walletData[element.id].amount / Math.pow(10, 9) : walletData[element.id].amount = walletData[element.id].amount / Math.pow(10, 6)
          walletData[element.id].symbol = element.content.metadata.symbol
          walletData[element.id].image = element.content.links.image
          walletData[element.id].holdingPrice = element.token_info.price_info.price_per_token * walletData[element.id].amount
          walletData[element.id].token_price = element.token_info.price_info.price_per_token
        }

    });


    setWalletData(walletData)
  } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
  }
}

function buttonChecker() {

  if(isValidAddress && walletConnected && balance > 50000){
    setButtonText("check if you're rekt")
    setButtonLogic(true)
  } else if(walletConnected && balance < 50000){
    setButtonText("you need at least 50000 ROUNDTRIP to search")
    setButtonLogic(false)
  } else if(!walletConnected){
    setButtonText("please connect wallet")
    setButtonLogic(false)
  } else if(!isValidAddress){
    setButtonText("enter a valid address")
    setButtonLogic(false)
  }
  console.log("Button Logic " + buttonLogic)
  console.log("isValidAddress " + isValidAddress)
  console.log("walletConnected " + walletConnected)
  console.log("balance " + balance)
}

function isValidSolanaAddress() {
  // Regular expression for Solana address
  const solregex = /(^[1-9A-HJ-NP-Za-km-z]{32,44}$)/g 
  const check = solregex.test(walletAddress)
  console.log("Checked for " + walletAddress + " Result is " + check)
  setisValidAddress(check)
}


useEffect(() => {
  isValidSolanaAddress();
  buttonChecker();
}, [walletConnected, walletData, walletAddress, balance, buttonLogic]);

useEffect(() => {
  buttonChecker(); // Check button logic immediately after isValidAddress changes
}, [isValidAddress]); // Only trigger effect when isValidAddress changes



const fetchData = async () => {
  setIsLoading(true);
  await fetchTokensWithNonZeroBalance();
  await calculateSolDiff();
  setIsLoading(false);
  walletRef.current.scrollIntoView({ behavior: 'smooth', block: "start" });
};


  return (
    <div className="Memefolio">
      {isLoading && <LoadingModal />}
        <header className="Memefolio-header">
        <div className='wallet-connection' >
          {!walletConnected ? (
            <button className='wallet-connection-button' onClick={connectWallet}>Connect to Wallet</button>
          ) : (
            <div className='wallet-connection-success' >
              <p>Holdings:</p>
              <p>${balance} ROUNDTRIP!</p>
            </div>
          )}
        </div>
            <div className='Memefolio-text' > 
              <h1>Roundtripped</h1>
              <p>check your memecoin P&L easily with just a click.</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Wallet Address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <button onClick={fetchData} disabled={!buttonLogic}>{buttonText}</button>
              </div>
              <span>- sol change is calculated with buys and sells. <br></br> - airdrops are tokens that are sent from different wallets. <br></br> - especially developed for Pumpfun users <br></br> - Make sure to hold enough $ROUNDTRIP in your Wallet <br></br> - Prices can differ because of high volatility, estimated value might be wrong <br></br> - Official CA:  .  </span>
            </div>
          </header>
        <div
         ref={walletRef}> 
          {transactionsData && walletData ? (
            <UserStatistics walletAddress={walletAddress} walletData={walletData} transactionsData={transactionsData} weeklyData={weeklyData}/>
          ) : ( null
          )}
        </div>
    </div>
  );
}

export default Memefolio;
