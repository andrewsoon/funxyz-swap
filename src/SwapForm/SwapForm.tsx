import { getAssetErc20ByChainAndSymbol, getAssetPriceInfo, type Erc20AssetInfo } from "@funkit/api-base";
import { BigNumber } from "bignumber.js";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [selectingToken, setSelectingToken] = useState<TokenSourceOrDest>('src')
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
      } catch (err) {
        console.error('Failed to fetch token prices:', err)
      }
    }

    fetchTokenPrices()
    const interval = setInterval(() => fetchTokenPrices(), 10000)
    return () => clearInterval(interval)

  }, [tokenProperties])

  const handleSelectToken = (symbol: string) => {
    if (selectingToken === 'src') {
      setSrcToken(symbol)
    } else {
      setDstToken(symbol)
    }
    setSrcTokenAmount(undefined)
    setDstTokenAmount(undefined)
    setOpenModal(false)
  }

  const handleInputAmountChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    type: TokenSourceOrDest
  ) => {
    const parsed = parseFloat(e.target.value)
    const amount = isNaN(parsed) ? undefined : parsed

    const isSrc = type === "src"
    const fromToken = isSrc ? srcToken : dstToken
    const toToken = isSrc ? dstToken : srcToken

    const fromPrice = tokenPriceMap?.[fromToken ?? ""]
    const toPrice = tokenPriceMap?.[toToken ?? ""]

    if (fromPrice && toPrice) {
      const convertedAmount = new BigNumber(amount ?? 0).times(fromPrice).div(toPrice).dp(5).toNumber()

      if (isSrc) {
        setDstTokenAmount(convertedAmount)
      } else {
        setSrcTokenAmount(convertedAmount)
      }
    }

    if (isSrc) {
      setSrcTokenAmount(amount)
    } else {
      setDstTokenAmount(amount)
    }
  }, [tokenPriceMap, srcToken, dstToken])

  const srcTokenValue = useMemo(() => {
    const price = tokenPriceMap?.[srcToken ?? ''] ?? 0
    const amount = srcTokenAmount ?? 0
    const value = new BigNumber(amount).times(price)
    return value
  }, [tokenPriceMap, srcToken, srcTokenAmount])

  const dstTokenValue = useMemo(() => {
    const price = tokenPriceMap?.[dstToken ?? ''] ?? 0
    const amount = dstTokenAmount ?? 0
    const value = new BigNumber(amount).times(price)
    return value
  }, [tokenPriceMap, dstToken, dstTokenAmount])

  return (
    <div className="swapform-wrapper">
      <h3 className="header">Token Price Explorer</h3>
      <h4 className="subheader">Compare token values before you swap</h4>
      <div className="quick-select-row">
        Quick select (From):
        <div className="quick-select-wrapper" >
          {QUICK_SELECT_WHITELIST.map((symbol) => {
            console.log('xx', getTokenIcon(symbol))
            return (
              <button className={`quick-select ${srcToken === symbol ? 'active' : ''}`} onClick={() => setSrcToken(symbol)} key={`quick-select-${symbol}`}>
                <img src={getTokenIcon(symbol)} alt={`${symbol}-icon`} />
                <p>{symbol}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div className="form-row">
        <div className="form-wrapper" onClick={() => srcInputRef.current?.focus()}>
          <h4 className="form-header">From</h4>
          <div className="amount-input">
            <input ref={srcInputRef} type="number" value={srcTokenAmount ?? ''} onChange={(e) => handleInputAmountChange(e, 'src')} placeholder="0" />
            <button className="token-select" onClick={() => {
              setSelectingToken('src')
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
        <div className="form-wrapper" onClick={() => dstInputRef.current?.focus()} >
          <h4 className="form-header">To</h4>
          <div className="amount-input">
            <input ref={dstInputRef} type="number" value={dstTokenAmount ?? ''} onChange={(e) => handleInputAmountChange(e, 'dst')} placeholder="0" />
            <button className="token-select" onClick={() => {
              setSelectingToken('dst')
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
          <h4>Select a Token ({selectingToken === 'src' ? 'From' : 'To'})</h4>
          <div className="token-list-header">
            <p>Token</p>
            <p>Price</p>
          </div>
          <div className="token-list">
            {ERC20_TOKEN_WHITELIST.map((token) => {
              return (
                <div className="token-option" onClick={() => handleSelectToken(token.symbol)} key={token.symbol}>
                  <div className="token-group">
                    <img src={`./node_modules/cryptocurrency-icons/svg/color/${token.symbol.toLowerCase()}.svg`} alt={`${srcToken}-icon`} />
                    <p>{token.symbol}</p>
                  </div>
                  <p>{new BigNumber(tokenPriceMap?.[token.symbol] ?? 0).toFormat(5)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SwapForm