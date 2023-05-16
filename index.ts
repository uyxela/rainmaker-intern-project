import { BigNumber, Contract, providers, utils } from "ethers";
import { WETH, USDC } from "./constants/tokens";
import { UniswapConstants } from "./constants/contracts";
import { EthereumConstants } from "./constants/chains";

const FROM_TOKEN = USDC;
const FROM_BALANCE = BigNumber.from("1000000");
const TO_TOKEN = WETH;

const UNISWAPPOOLFEE = 500; // hardcoding this value for convenience, Uniswap has several pool fee levels, the USDC/(W)ETH pool @ 0.05% is the largest
const PRECISION = 3; // 3 decimal places of precision after the decimal point
const TWO = BigNumber.from(2);

(async () => {
  console.info(
    `Converting ${FROM_BALANCE.toString()} ${FROM_TOKEN.symbol} to ${
      TO_TOKEN.symbol
    }`
  );

  // Instantiate a provider to access the Ethereum network
  const provider = new providers.JsonRpcProvider(EthereumConstants.RPC_URL);

  // Get the Uniswap V3 QuoterV2 contract
  const uniswapQuoterV2Contract = new Contract(
    UniswapConstants.QUOTERV2.address,
    UniswapConstants.QUOTERV2.abi,
    provider
  );

  // Use ethers and the DEX contract to figure out how much TO_TOKEN you can get for the FROM_TOKEN.
  // Use callStatic to simulate the transaction since the function is not gas efficient
  const {
    amountOut,
    sqrtPriceX96After,
  }: { amountOut: BigNumber; sqrtPriceX96After: BigNumber } =
    await uniswapQuoterV2Contract.callStatic.quoteExactInputSingle!({
      tokenIn: FROM_TOKEN.address,
      tokenOut: TO_TOKEN.address,
      fee: UNISWAPPOOLFEE,
      amountIn: utils.parseUnits(FROM_BALANCE.toString(), FROM_TOKEN.decimals),
      sqrtPriceLimitX96: 0, // setting this parameter to 0 makes it inactive
    });

  console.info(
    `Estimated swap balance: ${utils.formatUnits(
      amountOut,
      TO_TOKEN.decimals
    )} ${TO_TOKEN.symbol}`
  );

  const swapPrice = FROM_BALANCE.mul(
    BigNumber.from(10).pow(TO_TOKEN.decimals + 3)
  ).div(amountOut);

  // With Uniswap V3, the price for a pool can be obtained from the sqrtPriceX96 value from the slot0 function of the pool contract
  // Instantiate the Uniswap V3 Factory contract that will be used to get the pool address
  const uniswapV3FactoryContract = new Contract(
    UniswapConstants.V3FACTORY.address,
    UniswapConstants.V3FACTORY.abi,
    provider
  );

  // Get the pool address by passing in the two token addresses and the pool fee
  const poolAddress: string = await uniswapV3FactoryContract.getPool(
    FROM_TOKEN.address,
    TO_TOKEN.address,
    UNISWAPPOOLFEE
  );

  // Instantiate the pool contract that will be used to get the sqrtPriceX96 value
  const poolContract = new Contract(
    poolAddress,
    UniswapConstants.IUNISWAPV3POOL.abi,
    provider
  );

  const { sqrtPriceX96 }: { sqrtPriceX96: BigNumber } =
    await poolContract.slot0();

  // Calculate the price according to the sqrtPriceX96 value of the pool
  const poolPrice = TWO.pow(192)
    .mul(
      BigNumber.from(10).pow(
        TO_TOKEN.decimals - FROM_TOKEN.decimals + PRECISION
      )
    )
    .div(sqrtPriceX96.pow(2));

  // Calculate the price according to the sqrtPriceX96After value after a swap
  const poolPriceAfter = TWO.pow(192)
    .mul(
      BigNumber.from(10).pow(
        TO_TOKEN.decimals - FROM_TOKEN.decimals + PRECISION
      )
    )
    .div(sqrtPriceX96After.pow(2));

  // Calculate slippage on the swap.
  const slippagePercent = poolPrice
    .sub(swapPrice)
    .mul(10 ** (PRECISION + 2))
    .div(swapPrice);

  console.info(`Slippage: ${utils.formatUnits(slippagePercent, PRECISION)}%`);
  console.info(
    `Price of ${TO_TOKEN.symbol} in the pool: $${utils.formatUnits(
      poolPrice,
      PRECISION
    )}`
  );
  console.info(
    `Price of swapped ${TO_TOKEN.symbol}: $${utils.formatUnits(
      swapPrice,
      PRECISION
    )}`
  );
  console.info(
    `Price of ${TO_TOKEN.symbol} in the pool after swap: $${utils.formatUnits(
      poolPriceAfter,
      PRECISION
    )}`
  );
})();
