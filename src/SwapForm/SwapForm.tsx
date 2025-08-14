import { getAssetErc20ByChainAndSymbol, getAssetPriceInfo, type Erc20AssetInfo } from "@funkit/api-base";
import { BigNumber } from "bignumber.js";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Arrow from '../assets/Arrow-White.svg';
import Chevron from '../assets/Chevron-White.svg';
import Modal from "../common/Modal/Modal";
import { ERC20_TOKEN_WHITELIST, type ERC20Token } from "../constants/tokens";
import { getTokenIcon } from "../utils/tokenIcon";
import "./SwapForm.css";

const QUICK_SELECT_WHITELIST = ['USDC', 'USDT', 'ETH', 'WBTC']
const apiKey: string = import.meta.env.VITE_API_KEY

type TokenSourceOrDest = 'src' | 'dst'

const SwapForm: React.FC = () => {
  const [tokenProperties, setTokenProperties] = useState<{ [x: string]: Erc20AssetInfo } | undefined>(undefined)
  const [tokenPriceMap, setTokenPriceMap] = useState<{ [x: string]: number } | undefined>(undefined)
  const [pricesLastUpdated, setPricesLastUpdated] = useState<undefined | string>(undefined)

  const [lastEditedToken, setLastEditedToken] = useState<TokenSourceOrDest>('src')
  const [srcToken, setSrcToken] = useState<undefined | string>(undefined)
  const [srcTokenAmount, setSrcTokenAmount] = useState<number | undefined>(undefined)
  const [dstToken, setDstToken] = useState<undefined | string>(undefined)
  const [dstTokenAmount, setDstTokenAmount] = useState<number | undefined>(undefined)

  const [openModal, setOpenModal] = useState<boolean>(false)

  const dstInputRef = useRef<HTMLInputElement>(null)
  const srcInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    srcInputRef.current?.focus()
  }, [])

  const fetchAllTokens = async (tokens: ERC20Token[]) => {
    try {
      if (!apiKey) throw new Error('Invalid API key')
      const results = await Promise.allSettled(
        tokens.map(({ chainId, symbol }) => getAssetErc20ByChainAndSymbol({
          chainId,
          symbol,
          apiKey,
        }))
      )

      const tokenPropertiesMap: { [x: string]: Erc20AssetInfo } = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const tokenValue = result.value
          tokenPropertiesMap[tokenValue.symbol] = tokenValue
        } else {
          console.error(`Failed to fetch ${tokens[index].symbol} properties:`, result.reason)
        }
      })
      setTokenProperties(tokenPropertiesMap)
    } catch (err) {
      console.error('Failed to fetch token properties:', err)
    }
  }

  useEffect(() => {
    fetchAllTokens(ERC20_TOKEN_WHITELIST)
  }, [])

  useEffect(() => {
    if (!tokenProperties) return
    const fetchTokenPrices = async () => {
      try {
        if (!apiKey) throw new Error('Invalid API key')

        if (!tokenProperties) throw new Error('Token properties not initialized')

        const results = await Promise.allSettled(
          ERC20_TOKEN_WHITELIST.map(({ chainId, symbol }) => getAssetPriceInfo({
            chainId,
            assetTokenAddress: tokenProperties[symbol]?.address ?? "",
            apiKey,
          }))
        )

        const priceMap: { [x: string]: number } = {}
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const tokenPrice = result.value
            priceMap[ERC20_TOKEN_WHITELIST[index].symbol] = tokenPrice.unitPrice
          } else {
            console.error(`Failed to fetch ${ERC20_TOKEN_WHITELIST[index].symbol} price:`, result.reason)
          }
        })
        setTokenPriceMap(priceMap)
        const timestampString = new Date().toISOString()
        setPricesLastUpdated(timestampString)
        console.info(`Prices updated at: ${timestampString}`, priceMap)
      } catch (err) {
        console.error('Failed to fetch token prices:', err)
      }
    }

    fetchTokenPrices()
    const interval = setInterval(() => fetchTokenPrices(), 10000)
    return () => clearInterval(interval)

  }, [tokenProperties])

  const handleModalSelectToken = (symbol: string) => {
    if (lastEditedToken === 'src') {
      setSrcToken(symbol)
    } else {
      setDstToken(symbol)
    }
    setOpenModal(false)
  }

  const {
    srcDp,
    srcTokenValue,
    dstDp,
    dstTokenValue
  } = useMemo(() => {
    const srcDp = tokenProperties?.[srcToken ?? '']?.decimals ?? 0
    const srcPrice = tokenPriceMap?.[srcToken ?? ''] ?? 0
    const srcAmount = srcTokenAmount ?? 0
    const srcTokenValue = new BigNumber(srcAmount).dp(srcDp, BigNumber.ROUND_DOWN).times(srcPrice)

    const dstDp = tokenProperties?.[dstToken ?? '']?.decimals ?? 0
    const dstPrice = tokenPriceMap?.[dstToken ?? ''] ?? 0
    const dstAmount = dstTokenAmount ?? 0
    const dstTokenValue = new BigNumber(dstAmount).dp(dstDp, BigNumber.ROUND_DOWN).times(dstPrice)
    return {
      srcDp,
      srcTokenValue,
      dstDp,
      dstTokenValue,
    }
  }, [tokenPriceMap, srcToken, srcTokenAmount, dstToken, dstTokenAmount])

  const handleInputAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: TokenSourceOrDest
  ) => {
    const isSrc = type === "src"
    const parsed = parseFloat(e.target.value)

    let amount
    if (!isNaN(parsed)) {
      amount = new BigNumber(parsed).toNumber()
    }

    if (isSrc) {
      setLastEditedToken('src')
      setSrcTokenAmount(amount)
    } else {
      setLastEditedToken('dst')
      setDstTokenAmount(amount)
    }
  }

  const handleBlur = () => {
    if (srcTokenAmount) {
      const cleanedSrcAmount = new BigNumber(srcTokenAmount).dp(srcDp, BigNumber.ROUND_DOWN).toNumber()
      setSrcTokenAmount(Math.max(cleanedSrcAmount, 0))
    }

    if (dstTokenAmount) {
      const cleanedDstAmount = new BigNumber(dstTokenAmount).dp(dstDp, BigNumber.ROUND_DOWN).toNumber()
      setDstTokenAmount(Math.max(cleanedDstAmount, 0))
    }
  }

  useEffect(() => {
    if (!srcToken || !dstToken || !tokenPriceMap) return

    const srcPrice = tokenPriceMap[srcToken] ?? 0
    const dstPrice = tokenPriceMap[dstToken] ?? 0
    if (lastEditedToken === 'src') {
      if (!srcTokenAmount) return
      const convertedDstAmount = new BigNumber(srcTokenAmount).times(srcPrice).div(dstPrice).dp(dstDp, BigNumber.ROUND_DOWN).toNumber()
      if (dstTokenAmount !== convertedDstAmount) {
        setDstTokenAmount(convertedDstAmount)
      }
    } else {
      if (!dstTokenAmount) return
      const convertedSrcAmount = new BigNumber(dstTokenAmount).times(dstPrice).div(srcPrice).dp(srcDp, BigNumber.ROUND_DOWN).toNumber()
      if (srcTokenAmount !== convertedSrcAmount) {
        setSrcTokenAmount(convertedSrcAmount)
      }
    }
  }, [lastEditedToken, srcToken, dstTokenAmount, srcToken, dstToken, tokenPriceMap, srcTokenAmount, dstTokenAmount])

  return (
    <div className="swapform-wrapper">
      <h3 className="header">Token Price Explorer</h3>
      <h4 className="subheader">Compare token values before you swap</h4>
      <div className="quick-select-row">
        Quick select (From):
        <div className="quick-select-wrapper" >
          {QUICK_SELECT_WHITELIST.map((symbol) => {
            return (
              <button
                className={`quick-select ${srcToken === symbol ? 'active' : ''}`}
                onClick={() => {
                  setLastEditedToken('src')
                  setSrcToken(symbol)
                }}
                key={`quick-select-${symbol}`}
              >
                <img src={getTokenIcon(symbol)} alt={`${symbol}-icon`} />
                <p>{symbol}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div className="form-row">
        <div className={`form-wrapper ${lastEditedToken === 'src' && 'focus'}`}
          onClick={() => {
            setLastEditedToken('src')
            srcInputRef.current?.focus()
          }}
        >
          <h4 className="form-header">From</h4>
          <div className={`amount-row ${lastEditedToken === 'src' && 'focus'}`}>
            <input ref={srcInputRef}
              type="number"
              value={srcTokenAmount ?? ''}
              className={`amount-input ${lastEditedToken === 'src' && 'focus'}`}
              onChange={(e) => handleInputAmountChange(e, 'src')}
              placeholder="0"
              onBlur={handleBlur}
              onFocus={() => setLastEditedToken('src')}
            />
            <button className="token-select" onClick={() => {
              setLastEditedToken('src')
              setOpenModal(true)
            }}
            >
              {srcToken ? (
                <>
                  <img src={`./node_modules/cryptocurrency-icons/svg/color/${srcToken.toLowerCase()}.svg`} alt={`${srcToken}-icon`} />
                  <p>{srcToken}</p>

                </>
              ) : (
                "Select Token"
              )}
              <img src={Chevron} className="chevron" />
            </button>
          </div>
          <p className="token-value">{srcTokenValue.toFormat(5)} USD</p>
        </div>
        <div className="arrow-wrapper">
          <img src={Arrow} alt="arrow-icon" className="arrow-icon" />
        </div>
        <div className={`form-wrapper ${lastEditedToken === 'dst' && 'focus'}`}
          onClick={() => {
            setLastEditedToken('dst')
            dstInputRef.current?.focus()
          }}
        >
          <h4 className="form-header">To</h4>
          <div className={`amount-row ${lastEditedToken === 'dst' && 'focus'}`}>
            <input
              ref={dstInputRef}
              type="number"
              value={dstTokenAmount ?? ''}
              className={`amount-input ${lastEditedToken === 'dst' && 'focus'}`}
              onChange={(e) => handleInputAmountChange(e, 'dst')}
              placeholder="0"
              onBlur={handleBlur}
              onFocus={() => setLastEditedToken('dst')}
            />
            <button className="token-select" onClick={() => {
              setLastEditedToken('dst')
              setOpenModal(true)
            }}
            >
              {dstToken ? (
                <>
                  <img src={`./node_modules/cryptocurrency-icons/svg/color/${dstToken.toLowerCase()}.svg`} alt={`${dstToken}-icon`} />
                  <p>{dstToken}</p>

                </>
              ) : (
                "Select Token"
              )}
              <img src={Chevron} className="chevron" />
            </button>
          </div>
          <p className="token-value">{dstTokenValue.toFormat(5)} USD</p>
        </div>
      </div>
      <div className="cta-wrapper">
        <button className="swap-cta" disabled>Swap <p className="coming-soon-tag">Coming Soon</p></button>
      </div>
      <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
        <div>
          <h4>Select a Token ({lastEditedToken === 'src' ? 'From' : 'To'})</h4>
          <div className="token-list-header">
            <p>Token</p>
            <p>Price</p>
          </div>
          <div className="token-list">
            {ERC20_TOKEN_WHITELIST.map((token) => {
              return (
                <div className="token-option" onClick={() => handleModalSelectToken(token.symbol)} key={token.symbol}>
                  <div className="token-group">
                    <img src={`./node_modules/cryptocurrency-icons/svg/color/${token.symbol.toLowerCase()}.svg`} alt={`${srcToken}-icon`} />
                    <p>{token.symbol}</p>
                  </div>
                  <p>{new BigNumber(tokenPriceMap?.[token.symbol] ?? 0).toFormat(5)}</p>
                </div>
              )
            })}
          </div>
          <p className="last-update-text">Last updated: {pricesLastUpdated ?? "-"}</p>
        </div>
      </Modal>
    </div>
  )
}

export default SwapForm