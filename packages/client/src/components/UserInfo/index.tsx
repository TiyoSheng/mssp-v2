import React, { useEffect, useState } from 'react';
import './styles.scss';
import UserPackage from '@/components/UserPackage';
import Appearance from '@/components/Appearance';
import * as PIXI from 'pixi.js';
import { Stage } from '@pixi/react';
import Player, { IPlayer } from '@/components/PIXIPlayers/Player';
import { MapConfig } from '@/config/map';
import Equipment from '@/components/Equipment';
const { cellSize } = MapConfig;

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

export interface IUserInfo {
  head: string;
  clothes: string;
  handheld: string;
  userUrl?: string;
  lootUrl?: string;
  player?: IPlayer;
}

const UserInfo = (props: IUserInfo) => {

  const { handheld, head, clothes, userUrl, lootUrl, player } = props;
  const lootHasLoaded = (handheld && head && clothes) || (player?.equip?.handheld && player?.equip?.head && player?.equip?.clothes);

  return (
    <div className={'mi-userinfo-wrapper'}>
      <div className="left-main-content">
        <h3>Equipment</h3>
        <div className="user-detail-wrapper">
          <div className="user-detail-content">
            <ul className="left-equipments equipments">
              <li className="equipments-item helmet-item">
                <Equipment type={'helmet'} name={player?.equip?.head}/>
              </li>
              <li className="equipments-item armor-item">
                <Equipment type={'armor'} name={player?.equip?.clothes}/>
              </li>
              <li className="equipments-item"></li>
              <li className="equipments-item"></li>
            </ul>
            <div className="user-appearance-wrapper">
              <div className="user-appearance-box">
                <Stage width={256} height={256} options={{ resolution: 1, backgroundAlpha: 0 }}>
                  <Player size={128} x={0.5} y={0.5} equip={player?.equip ?? {}} action={'idle'} />
                </Stage>
              </div>
            </div>
            <ul className="left-equipments equipments">
              <li className="equipments-item"></li>
              <li className="equipments-item"></li>
              <li className="equipments-item weapon-item">
                <Equipment type={'weapon'} name={player?.equip?.handheld}/>
              </li>
              <li className="equipments-item"></li>
            </ul>
          </div>
          {/*<div className={`loot-wrapper ${lootHasLoaded ? 'loaded' : ''}`}>*/}
          {/*  <div className="loot-detail">*/}
          {/*    {*/}
          {/*      userUrl ? <img src={userUrl} alt=""/> : null*/}
          {/*    }*/}
          {/*  </div>*/}
          {/*  <div className="loot-detail">*/}
          {/*    {*/}
          {/*      lootUrl ? <img src={lootUrl} alt=""/> : null*/}
          {/*    }*/}
          {/*  </div>*/}
          {/*</div>*/}

          <div className={`user-attr-wrapper ${lootHasLoaded ? 'loaded' : ''}`}>
            <dl>
              <dt>HP</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.hp?.toString()  : 0} / {lootHasLoaded ? player?.maxHp?.toString()  : 0}</span><span className="extra-attr">{lootHasLoaded ? player?.hp?.toString() : ''}</span></dd>
            </dl>
            <dl>
              <dt>Attack</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.attack?.toString() : 0}</span><span className="extra-attr">{lootHasLoaded ? player?.attack?.toString() : ''}</span></dd>
            </dl>
            <dl>
              <dt>AttackRange</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.attackRange?.toString() : 0}</span><span className="extra-attr">{lootHasLoaded ? player?.attackRange?.toString() : ''}</span></dd>
            </dl>
            <dl>
              <dt>Speed</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.speed?.toString() : 0}</span><span className="extra-attr">{lootHasLoaded ? player?.speed?.toString() : ''}</span></dd>
            </dl>
            <dl>
              <dt>Strength</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.strength?.toString() : 0}</span><span className="extra-attr">{lootHasLoaded ?player?.strength?.toString() : ''}</span></dd>
            </dl>
            <dl>
              <dt>Space</dt>
              <dd><span className="base-attr">{lootHasLoaded ? player?.space?.toString() : 0}</span><span className="extra-attr">{lootHasLoaded ? player?.space?.toString() : ''}</span></dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="right-main-content">
        <UserPackage
          gem={player?.oreBalance}
          title={'Package'}
        />
        <UserPackage
          gem={player?.seasonOreBalance}
          title={'Inventory'}

        />
      </div>
    </div>
  );
};

export default UserInfo;