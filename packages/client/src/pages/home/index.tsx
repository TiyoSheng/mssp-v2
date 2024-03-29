import React, { useEffect, useRef, useState } from 'react';
import Header from '@/pages/home/header';
import './styles.scss';
import Loading from '@/components/Loading';
import MintList from '@/config/mint';
import { message, Modal } from 'antd';
import UserInfo from '@/components/UserInfo';
import { UserAddress } from '@/mock/data';
import { UserAddressKey } from '@/config';
import { useNavigate } from 'react-router-dom';
import Duck from '@/config/duck';
import { delay } from '@/utils';
import { useMUD } from '@/mud/MUDContext';
import { useEntityQuery } from "@latticexyz/react";
import { Has, getComponentValue } from '@latticexyz/recs';
import { decodeEntity, encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { ethers } from 'ethers';

import indexDuckImg from '@/assets/img/duck_index.svg';

import lootAbi from '../../../../contracts/out/Loot.sol/MLoot.abi.json'
import userAbi from '../../../../contracts/out/User.sol/MUser.abi.json'
import pluginAbi from '../../../../contracts/out/Plugin.sol/MPlugin.abi.json'

let userContract: any
let lootContract: any
let pluginContract: any

let userTokenIds: any
let lootTokenIds: any

let transfering = false

const Home = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const {
    components: { GlobalConfig, Player, LootList1, PlayerAddon, GameConfig, SyncProgress },
    systemCalls: { selectBothNFT, joinBattlefield, setInfo, initUserInfo },
    network
  } = useMUD();

  const [step, setStep] = useState('play');
  const usernameRef = useRef<HTMLInputElement>();
  const [modalVisible, setModalVisible] = useState(false);

  const [minting, setMinting] = useState(false);

  const navigate = useNavigate();

  const [clothes, setClothes] = useState<string>();
  const [handheld, setHandheld] = useState<string>();
  const [head, setHead] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [userUrl, setUserUrl] = useState<string>();
  const [lootUrl, setLootUrl] = useState<string>();
  const [player, setPlayer] = useState<any>();

  // isOpen
  const [isOpen, setIsOpen] = useState(import.meta.env.VITE_IS_OPEN == 'true' ? true : false);
  const [percentage, setPercentage] = useState(0);

  const GameConfigData = useEntityQuery([Has(GameConfig)]).map((entity) => getComponentValue(GameConfig, entity));

  const syncprogressData = useEntityQuery([Has(SyncProgress)]).map((entity) => getComponentValue(SyncProgress, entity));
  const syncprogress = syncprogressData[0]

  // useEffect(() => {
  //   if (syncprogress?.percentage == 100) {
  //     console.log('syncprogress', syncprogress)
  //     setIsOpen(GameConfigData[0]?.isOpen)
  //   }
  // }, [syncprogress?.percentage])
  useEffect(() => {
    // 获取参数
    const params = new URLSearchParams(window.location.search);
    const author = params.get("author")
    if (author) {
      setIsOpen(true)
    }
  }, [])

  const LootList1Data = useEntityQuery([Has(LootList1)]).map((entity) => {
    const loot = getComponentValue(LootList1, entity);
    const address = decodeEntity({ addr: "address" }, entity)?.addr?.toLocaleLowerCase() || ''
    loot.addr = address
    return loot;
  })

  const players = useEntityQuery([Has(Player)]).map((entity) => {
    const address = decodeEntity({ addr: "address" }, entity)?.addr?.toLocaleLowerCase() || ''
    const player = getComponentValue(Player, entity);
    player.addr = address
    LootList1Data.forEach((item) => {
      if (item.addr.toLocaleLowerCase() === address.toLocaleLowerCase()) {
        let clothes = item.chest.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
        let handheld = item.weapon.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
        let head = item.head.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
        player.equip = {
          clothes,
          handheld,
          head,
        }
      }
    })
    return player;
  })

  const curPlayer = players.find(player => player.addr.toLocaleLowerCase() == network?.account.toLocaleLowerCase());

  const GlobalConfigData = useEntityQuery([Has(GlobalConfig)]).map((entity) => getComponentValue(GlobalConfig, entity));

  console.log(GlobalConfigData, 'GlobalConfigData', syncprogress?.percentage)

  // console.log(lootAbi, 'lootAbi', userAbi, 'userAbi', pluginAbi, 'pluginAbi')

  if (GlobalConfigData.length && GlobalConfigData[0].userContract) {
    let privateKey = network.privateKey
    let rpc = network.walletClient?.chain?.rpcUrls?.default?.http[0] || 'http://127.0.0.1:8545'
    let provider = new ethers.providers.JsonRpcProvider(rpc)
    let wallet = new ethers.Wallet(privateKey, provider)
    let userContractAddress = GlobalConfigData[0].userContract
    userContract = new ethers.Contract(userContractAddress, userAbi, wallet)
    userContract?.getUserTokenIdList().then(res => {
      userTokenIds = res
    })
  }

  if (GlobalConfigData.length && GlobalConfigData[0].lootContract && !lootContract) {
    let privateKey = network.privateKey
    let rpc = network.walletClient?.chain?.rpcUrls?.default?.http[0] || 'http://127.0.0.1:8545'
    let provider = new ethers.providers.JsonRpcProvider(rpc)
    let wallet = new ethers.Wallet(privateKey, provider)
    let lootContractAddress = GlobalConfigData[0].lootContract
    lootContract = new ethers.Contract(lootContractAddress, lootAbi, wallet)
    lootContract?.getUserTokenIdList().then(res => {
      lootTokenIds = res
    })
  }


  if (GlobalConfigData.length && GlobalConfigData[0].pluginContract && !pluginContract) {
    let privateKey = network.privateKey
    let rpc = network.walletClient?.chain?.rpcUrls?.default?.http[0] || 'http://127.0.0.1:8545'
    let provider = new ethers.providers.JsonRpcProvider(rpc)
    let wallet = new ethers.Wallet(privateKey, provider)
    let pluginContractAddress = GlobalConfigData[0].pluginContract
    pluginContract = new ethers.Contract(pluginContractAddress, pluginAbi, wallet)
  }

  const atobUrl = (url) => {
    url = url.replace('data:application/json;base64,', '')
    url = atob(url)
    url = JSON.parse(url)
    return url
  }

  // console.log(curPlayer, 'curPlayer', players)

  useEffect(() => {
    async function init() {
      if (curPlayer?.state >= 1 && curPlayer?.name) {
        let addon = getComponentValue(PlayerAddon, encodeEntity({addr: "address"}, {addr: curPlayer.addr}))
        let userTokenId = addon.userId.toString()
        let lootTokenId = addon.lootId.toString()
    
        let urls = await Promise.all([userContract.tokenURI(userTokenId), lootContract.tokenURI(lootTokenId)])
        let url = urls[0]
        let lootUrl = urls[1]
        url = atobUrl(url)
        lootUrl = atobUrl(lootUrl)
        curPlayer.userUrl = url.image
        curPlayer.lootUrl = lootUrl.image
        setUsername(curPlayer.name);
        setClothes(curPlayer?.equip?.clothes);
        setHandheld(curPlayer?.equip?.handheld);
        setHead(curPlayer?.equip?.head);
        setUserUrl(curPlayer.userUrl);
        setLootUrl(curPlayer.lootUrl);
        setPlayer(curPlayer);
      }
    }
    init()
    // const address = localStorage.getItem(UserAddressKey);
    // if (address) {
    //   setWalletAddress(address);
    // }
  }, [curPlayer]);

  const createWallet = () => {
    setModalVisible(true);
  }
  const toMint = async () => {
    console.log(usernameRef.current.value, 'usernameRef.current.value')
    if (!usernameRef.current.value) {
      message.error('Please input your username');
      return;
    }
    setUsername(usernameRef.current.value);
    setModalVisible(false);
    mintAndGo('', usernameRef.current.value);
  }

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      toMint();
    }
  }

  const mint = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        let res = await pluginContract.multMint()
        await res.wait()
        let blockNumber = await network.publicClient.getBlockNumber()
        let interval = setInterval(async () => {
          let currentBlockNumber = await network.publicClient.getBlockNumber()
          if (currentBlockNumber - blockNumber >= 2) {
            clearInterval(interval)
            let tokenIds = await Promise.all([userContract.getUserTokenIdList(), lootContract.getUserTokenIdList()])
            userTokenIds = tokenIds[0]
            lootTokenIds = tokenIds[1]
            let revealres = await pluginContract.multRevealNFT(lootTokenIds[lootTokenIds?.length - 1].toString(), userTokenIds[userTokenIds?.length - 1].toString())
            console.log(revealres, 'revealres')
            await revealres.wait()
            resolve('success')
          }
        }, 1000)
      } catch (error) {
        console.log(error)
        reject(error)
      }
    })
  }

  const toObject = (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === 'bigint' ? value.toString() : value
  ))
}

  const mintAndGo = async (type, uName) => {
    console.log('mintAndGo')
    if (syncprogress?.percentage != 100) {
      message.error('Waiting for sync...');
      return;
    }
    if (!username && !uName) {
      createWallet();
      return;
    }
    setMinting(true);
    try {
      if (!(userTokenIds?.length && lootTokenIds?.length) || (type == 'mint')) {
        message.loading('minting loot and user,please wait...')
        await mint()
        message.destroy()
      }
      if (curPlayer?.state >= 2) {
        navigate('/game');
        return;
      } else if (curPlayer?.state == 1) {
        message.loading('join battlefield')
        await joinBattlefield()
        message.destroy()
        navigate('/game');
        return
      }
      let userTokenId = userTokenIds[userTokenIds?.length - 1].toString()
      let lootTokenId = lootTokenIds[lootTokenIds?.length - 1].toString()
  
      let urls = await Promise.all([userContract.tokenURI(userTokenId), lootContract.tokenURI(lootTokenId)])
      let url = urls[0]
      let lootUrl = urls[1]
      console.log("get loot and user success")
      console.log(urls, 'url')
      try {
        url = atobUrl(url)
        lootUrl = atobUrl(lootUrl)
      } catch (error) {
        mintAndGo('mint')
        console.log(error)
      }
      

      setUserUrl(url.image)
      setLootUrl(lootUrl.image)
      let { playerData, lootData } = await selectBothNFT(userTokenId, lootTokenId, network.account)
  
      let clothes = lootData.chest.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
      let handheld = lootData.weapon.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
      let head = lootData.head.replace(/"(.*?)"/, '').split(' of')[0].replace(/^\s+|\s+$/g,"")
      setPlayer(playerData)
      setClothes(clothes);
      setHandheld(handheld);
      setHead(head);

      playerData.equip = {
        clothes,
        handheld,
        head,
      }

      let player = Object.assign(playerData, {username: username || uName, clothes, handheld, head, userUrl: url.image, lootUrl: lootUrl.image})
      console.log(player, 'player')
      // localStorage.setItem('playerInfo', JSON.stringify(toObject(player)));
      
      let result = await Promise.all([setInfo(player.username, ''), joinBattlefield()])
      console.log(result, 'result')
      setMinting(false);
      navigate('/game', {
        state: {
          username,
          clothes,
          handheld,
          head,
        }
      });
    } catch (error) {
      setMinting(false);
      console.log(error)
      message.error(error);
    }
  }

  const getProgress = () => {
    if (syncprogress?.percentage == 100) {
      return '100%'
    } else {
      if (syncprogress?.percentage) {
        return Math.floor(syncprogress?.percentage * 100) + '%'
      } else {
        return '0%'
      }
    }
  }

  const play = () => {
    if (!isOpen) {
      message.error(`Please wait for open demo day`);
      return;
    }
    if (!network.account) {
      message.error('waiting for wallet connection');
      return;
    }
    if (curPlayer?.state >= 1) {
      setStep('mint');
    } else {
      localStorage.removeItem('curPlayer');
      localStorage.removeItem('worldContractAddress');
      setStep('mint');
      // createWallet();
    }
  }

  return (
    <div className="mi-home-page">
      {contextHolder}
      <Header
        onPlayBtnClick={play}
      />
      {
        step === 'play' && (
          <section className="mi-section index-section">
            <div className="section-box">
              <div className="intro-box">
                <h1 className={'intro-title'}>Welcome to Mississippi</h1>
                <p>
                  An ancient cave, cursed by its creator, opens intermittently as if alive <br/><br/>

                  The cavern is rich in energy gems that prudent adventurers can take, while those who miss the time to leave due to greed will be trapped in the cavern forever <br/><br/>

                  The Mississippi Company executives saw the value of the caves and decided to monopolize them <br/><br/>

                  Just when the plan was about to succeed, a group of crazy duck adventurers stormed into the cave...
                </p>
                <button className="play-btn mi-btn" onClick={play}>{(!isOpen) ? 'Please wait for open demo day' : 'PLAY NOW'}</button>

              </div>
            </div>
            <img src={indexDuckImg} alt="duck" className={'duck-index'}/>

          </section>
        )
      }

      {
        step === 'mint' && (
          <div className="mi-section mint-section">
            <div className="mint-box">
              <h2 className="mint-title">HOME</h2>
              <UserInfo clothes={clothes} handheld={handheld} head={head} userUrl={userUrl} lootUrl={lootUrl} player={player} />
              <button className="mi-btn" onClick={mintAndGo} disabled={minting}>
                {syncprogress?.percentage == 100 ? minting ? 'Loading...' : (userTokenIds?.length && lootTokenIds?.length) ? 'Join The Game' : 'MINT AND GO': `Waiting for sync... ${getProgress()}`}
              </button>
              {
                minting ? <div style={{textAlign: 'center', fontSize: '12px'}}>The minting process may take up to several tens of seconds</div> : null
              }
            </div>
          </div>
        )
      }
      <Modal
        open={modalVisible}
        className="mi-modal"
        footer={null}
        onCancel={() => setModalVisible(false)}
      >
        <div className="create-wallet-wrapper">
          <div className="create-wallet-content">
            You have successfully created a wallet.Name your character and start your journey!
          </div>
          <div className="mint-name">
            <input type="text" className="mi-input" ref={usernameRef} onKeyUp={handleKeyUp} />
            <button className="mi-btn" onClick={toMint}>OK</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;