import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants" //we can only mention the folder name, as the index.js in the folder represents the entire folder
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import { Info, useNotification } from "web3uikit"
import { Windows } from "web3uikit"

export default function LotteryEntrance() {

    const {chainId: chainIdHex, isWeb3Enabled} = useMoralis()
    const chainId = parseInt(chainIdHex)  
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    
    const dispatch = useNotification()

    const { runContractFunction: enterRaffle, isLoading, isFetching } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })


    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},   
    })

    const { runContractFunction: getNumOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumOfPlayers",
        params: {},   
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},   
    })






    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numPlayersFromCall = (await getNumOfPlayers()).toString()
        const recentWinnerFromCall = (await getRecentWinner()).toString()

        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
    }

    //Comment this useEffect if any error
    useEffect(() => {
        const { ethereum } = window;
    
        if (ethereum) {
        console.log("provider");
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const raffle = new ethers.Contract(
          "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",  //had to hardcode the contract address, since I was running into some otherissues
          abi,
          signer
        )
  
        raffle.on("WinnerPicked", (recentWinner) => {
          console.log(recentWinner);
          setRecentWinner(recentWinner);   //useState
        })
      }
    }, [])





    
    useEffect(() => {

        if(isWeb3Enabled) {
            updateUI()
        }
       
    }, [isWeb3Enabled])


    
    const handleSuccess = async function(tx) {
        await tx.wait(1)
        handlNewNotification(tx)
        updateUI()
    }


    const handlNewNotification = function() {
        dispatch({
            type: Info,
            title: "Tx Notification",
            message: "Transaction Completed!",
            position: "topR",
            icon: "Bell"
        })
    }

    return (
        <div className="p-5">
            Hi from lottery !

            {raffleAddress ? (
                <div className="">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto" 
                        onClick={async function() {
                            await enterRaffle({onSuccess: handleSuccess, onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : ("Enter Raffle")
                        }

                     </button>
                    <br/>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                    <br/> Players: {numPlayers}
                    <br/>Recent Winner: {recentWinner}
                    
                </div>
                    
            ) : (
                <div>No Raffle Address Detected!</div>
                
            )}

        </div>
    )
}





