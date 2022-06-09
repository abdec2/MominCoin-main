import { ethers } from 'ethers';
import { useContext, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import { GlobalContext } from '../context/GlobalContext';
import CONFIG from './../abi/config.json';

import CROWDSALE_ABI from './../abi/abi.json';
import tokenAbi from './../abi/token.json';
import { parse } from 'url';
const crowdsaleAddress = CONFIG.ICO_CONTRACT_ADDRESS;

function Presale() {
    const { account, tokenBalance, bnbBalance } = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [recQty, setRecQty] = useState(0);

    const ethPrice = useRef(null);

    const addToken = async () => {
        const tokenAddress = CONFIG.TOKEN_CONTRACT;
        const tokenSymbol = CONFIG.TOKEN_SYMBOL;
        const tokenDecimals = CONFIG.TOKEN_DECIMAL;
        const tokenImage = '';

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20', // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            });

            if (wasAdded) {
                console.log('Thanks for your interest!');
            } else {
                console.log('Your loss!');
            }
        } catch (error) {
            console.log(error);
        }
    }

    const validatePrice = () => {
        if(parseInt(ethPrice.current.value) >= 5) {
            return true;    
        }
        return false;
    }

    const approveUSDT = async (e) => {
        e.preventDefault();
        try {
            if (!window.ethereum) {
                alert('Please install MetaMask');
                return
            }
            if (!account) {
                alert('Please connnect wallet');
                return;
            }
            if(!validatePrice()) {
                alert('Purchase should be made minimum 5 USDT');
                return;
            }

            setLoading(true);
            const web3modal = new Web3Modal();
            const instance = await web3modal.connect();
            const provider = new ethers.providers.Web3Provider(instance);
            const signer = provider.getSigner();
            const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, tokenAbi, signer);
            const price = ethers.utils.parseEther(ethPrice.current.value);
            const transaction = await usdtContract.approve(CONFIG.ICO_CONTRACT_ADDRESS, price, {from: account});
            await transaction.wait();
            buyToken(price, signer);
        } catch (e) {
            setLoading(false);
        }
        
    }

    const buyToken = async (price, signer) => {
        try {
            const contract = new ethers.Contract(crowdsaleAddress, CROWDSALE_ABI, signer);
            
            if (bnbBalance < ethPrice.current.value) {
                setLoading(false);
                alert('Insufficient Balance');
                return;
            }

            const transaction = await contract.buyTokens(account, price.toString());
            await transaction.wait();

            setLoading(false);
            alert('purchase done');
        } catch (e) {
            setLoading(false);
        }
    }

    const calReceivedToken = () => {
        setRecQty(parseInt(ethPrice.current.value) / parseFloat(CONFIG.RATE))
    }

    return (
        <div className="my-11 p-7 flex items-center flex-col md:flex-row justify-between border border-white border-opacity-20 rounded-3xl shadow-xl ">
            <div className="md:pl-8 text-center md:text-left md:mr-2">
                <h1 className="text-base sm:text-xl font-bold uppercase text-[#33FF68]" >Initial Coin Offering</h1>
                <h1 className="text-2xl sm:text-4xl font-bold uppercase text-black" >Momin World Coin</h1>
                <button className='mt-5 px-6 py-2 bg-[#33FF68] text-black rounded font-bold hover:bg-yellow-300' onClick={() => addToken()}>Add Token to your MetaMask</button>
                {/* <div className='mt-3 hidden md:block'>
                <p className="text-lg">For Progress, Investment & Success</p>
            </div> */}
                <div className='mt-10 text-left'>
                    <h3 className=' uppercase text-sm font-semibold mb-2 text-[#33FF68]'>Instructions:</h3>
                    <ul className='text-sm list-outside list-disc'>
                        <li className='ml-4'>Minimum purchase allowed: 5 USDT</li>
                        {/* <li className='ml-4'>Purchase amount should be multiple of minimum purchase</li> */}
                    </ul>
                </div>
            </div>
            <div className="my-10 border p-10 rounded-xl border-white border-opacity-30  ">
                {account && (
                    <>
                        <p className='text-sm'>USDT Balance: {bnbBalance}</p>
                        <p className='text-sm'>Your Momin Balance: {tokenBalance} </p>
                    </>
                )}
                <form onSubmit={approveUSDT}>
                    <div className="my-3">
                        <label className="text-base font-bold text-[#33FF68]">Amount USDT</label>
                        <input ref={ethPrice} type="text" className="w-full h-12 rounded-lg p-2 text-xl focus:outline-none mt-1 bg-white bg-opacity-30 border" required onChange={calReceivedToken} />
                        <small>You will receive: {((recQty) ? recQty : 0) + ' ' + CONFIG.TOKEN_SYMBOL}</small>

                    </div>
                    <div className="my-3">
                        <label className="text-base font-bold text-[#33FF68]">Rate</label>
                        <input className="w-full h-12 rounded-lg p-2 text-xl focus:outline-none mt-1 border" type="text" value={CONFIG.RATE + " USDT" } disabled />
                    </div>

                    <div className="mt-10">
                        <button disabled={loading} className="w-full py-2 px-6 uppercase bg-[#33FF68] hover:bg-yellow-300 rounded  font-bold text-black">{loading ? 'Busy' : 'Buy'}</button>

                    </div>
                </form>
            </div>
            <div className="before:fixed before:top-0 before:left-0 before:w-full page__bg -z-30"></div>
        </div>
    );
}

export default Presale;
