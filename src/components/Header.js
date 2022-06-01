import { ethers } from "ethers";
import { useContext, useEffect } from "react";
import Web3Modal from 'web3modal';
import { GlobalContext } from "../context/GlobalContext";
import logo from './../assets/logo5121.jpg';
import CONFIG from './../abi/config.json'
import tokenABI from './../abi/token.json'
import WalletConnectProvider from "@walletconnect/web3-provider";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.REACT_APP_INFURA_PROJECT_ID // required
    }
  }
};



const HeaderComponent = ({setError, setErrMsg}) => {

    const { account, addAccount, delAccount, updateTokenBalance, updateBNBBalance } = useContext(GlobalContext);

    const getTokenBalance = async(signer, address) => {
        const tokenContract = new ethers.Contract(CONFIG.TOKEN_CONTRACT, tokenABI, signer)
        const balanceOf = await tokenContract.balanceOf(address) 
        updateTokenBalance(ethers.utils.formatUnits(balanceOf, CONFIG.TOKEN_DECIMAL))
        console.log(ethers.utils.formatUnits(balanceOf, CONFIG.TOKEN_DECIMAL));
    }

    const getNativeBalance = async (provider, address) => {
        const nativeBalance = await provider.getBalance(address)
        updateBNBBalance(parseFloat(ethers.utils.formatEther(nativeBalance)).toFixed(4))
        console.log(parseFloat(ethers.utils.formatEther(nativeBalance)).toFixed(4))
    }

    const connectWallet = async () => {
        const web3modal = new Web3Modal({
            providerOptions
        });
        const instance = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(instance);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        addAccount({ id: address });
        const network = await provider.getNetwork();
        console.log(network)
        if(network.chainId !== CONFIG.NETWORK_ID ) {
            setError(true) 
            setErrMsg('Contract is not deployed on current network. please choose Binance Smartchain Mainnet')
        } else {
            setError(false) 
            setErrMsg('')
            getTokenBalance(signer, address)
            getNativeBalance(provider, address)
        }
        
    }
    useEffect(()=>{
        if(window.ethereum) {
            window.ethereum.on('accountsChanged', accounts => {
                addAccount({ id: accounts[0] })
            })
            window.ethereum.on('chainChanged', chainId => {
                window.location.reload();
            })
        }
    }, [account]);
    return (
        <div className="w-full flex items-center flex-col">
            <div className="max-w-[300px] p-2">
                <img src={logo} alt="logo" />
            </div>
            <div className="mt-4 sm:mt-0">
                {account ? (
                    <div className="flex items-center flex-col">
                        <a
                            href={`${CONFIG.BLOCKCHAIN_EXPLORER}address/${account}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-[#33FF68] hover:bg-yellow-300 rounded text-black">
                            {account.slice(0, 5) + '...' + account.slice(38, 42)}
                        </a>
                        <button className="text-xs text-right hover:text-yellow-500" onClick={() => delAccount()}>Disconnect</button>
                    </div>
                ) : (
                    <button className="px-6 py-2 bg-[#33FF68] hover:bg-yellow-300 rounded text-black font-bold" onClick={() => connectWallet()}>Connect Wallet</button>
                )}
            </div>

        </div>
    );
};

export default HeaderComponent;
