import React, { useState } from 'react';
import './Statistics.css';
import Modal from './Modal'; // Import the Modal component
import Portfolio from './Portfolio';

const Statistics = ({ walletData,transactionsData }) => {
  const [selectedToken, setSelectedToken] = useState(null);

  const openModal = (token) => {
    console.log("Opening modal for token:", token);
    setSelectedToken(token);
    console.log("Selected token state updated to:", token);
  };

  console.log(transactionsData)
  
  return (
    <div className='all-statistics' >
      <Portfolio walletData={walletData} />
      <div className="highlights">
        <div className='highlights-item'><h2>Total SOL Change <br/> {transactionsData['totalSolChange'].toFixed(4)} SOL</h2></div>
        <div className='highlights-item'><h2>Holding <br/> {transactionsData['holdings']} SOL</h2></div>
        <div className='highlights-item'><h2>Rugged <br/> {transactionsData['holdings']} SOL</h2></div>
      </div>
      <div className="statistics-grid">
        {Object.entries(transactionsData).map(([token, stats]) => (
          token !== 'totalSolChange' && (
            <div 
              key={token} 
              className={`statistics-item ${stats.tag === "holding" ? "holding-net" : (stats.net >= 0 ? 'positive-net' : 'negative-net')}`}
              onClick={() => openModal(token)}>
              <div className="item-details">
                <p className="token-name">{token}</p>
                <p>Buy: {stats.buy}</p>
                <p>Sell: {stats.sell}</p>
                <p>Net: {stats.net}</p>
              </div>
            </div>
          )
        ))}
      </div>
      {selectedToken && (
        <Modal isOpen={!!selectedToken} onClose={() => setSelectedToken(null)}>
          <button className="close-button" onClick={() => setSelectedToken(null)}>X</button>
          <h3>Transactions for {selectedToken}</h3>
          <div>
            {transactionsData[selectedToken].txs.map((tx, index) => (
              <div key={index} className={`transaction-item transaction-${tx.type}`}>
                <span className="transaction-detail">Time: </span><span>{tx.blockTime}</span>
                <span className="transaction-detail">Type: </span><span>{tx.type}</span>
                <span className="transaction-detail">SOL Change: </span><span>{tx.solChange}</span>
                <a href={tx.transactionId} target="_blank" rel="noopener noreferrer">View Transaction</a>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Statistics;


/*

*/