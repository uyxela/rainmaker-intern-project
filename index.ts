import { BigNumber } from 'ethers';
import { ETH, USDC } from './tokens';

const FROM_TOKEN = USDC;
const FROM_BALANCE = BigNumber.from('1000000');
const TO_TOKEN = ETH;

(async () => {
  console.info(`Converting ${FROM_BALANCE.toString()} ${FROM_TOKEN.symbol} to ${TO_TOKEN.symbol}`);

  // Get the contract for a DEX.

  // Use ethers and the DEX contract to figure out how much TO_TOKEN you can get
  // for the FROM_TOKEN.

  // TODO:
  const swapBalance = BigNumber.from('0');

  console.info(`Estimated swap balance: ${swapBalance.toString()} ${TO_TOKEN.symbol}`);

  // Figure out spot values of tokens.

  // Calculate slippage on the swap.

  // TODO:
  const slippagePercent = 0.01;

  console.info(`Slippage: ${slippagePercent * 100}%`);
})();
