import {
  isConnected,
  requestAccess,
  signTransaction as freighterSignTx,
} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// ── Typed error so callers can distinguish "not installed" from other failures
export class FreighterNotInstalledError extends Error {
  constructor() {
    super('Freighter extension is not installed');
    this.name = 'FreighterNotInstalledError';
  }
}

// Async check — uses the extension message-passing API (v6), not window.freighter
export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const res = await isConnected();
    return !!res.isConnected;
  } catch (err) {
    console.warn('[Freighter] isConnected check failed:', err);
    return false;
  }
}

export async function connectFreighter(): Promise<string | null> {
  // 1. Detect extension via official API
  const connRes = await isConnected();
  if (!connRes.isConnected) {
    console.warn('[Freighter] Extension not detected via isConnected()');
    throw new FreighterNotInstalledError();
  }

  // 2. Request user approval — opens the Freighter popup
  try {
    const accessRes = await requestAccess();
    if (accessRes.error) {
      console.error('[Freighter] requestAccess error:', accessRes.error);
      throw new Error(accessRes.error.message || 'Freighter erişim reddedildi');
    }
    const address = accessRes.address;
    console.info('[Freighter] Connected:', address.slice(0, 8) + '...');
    return address;
  } catch (err) {
    console.error('[Freighter] connectFreighter error:', err);
    throw err;
  }
}

export async function getBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const xlm = account.balances.find((b: any) => b.asset_type === 'native');
    return xlm ? parseFloat(xlm.balance).toFixed(2) : '0';
  } catch (err) {
    console.error('[Stellar] getBalance error for', address.slice(0, 8) + '...:', err);
    return '0';
  }
}

export async function fundTestnetAccount(address: string): Promise<void> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    if (!res.ok) throw new Error(`Friendbot HTTP ${res.status}`);
    console.info('[Stellar] Friendbot funded:', address.slice(0, 8) + '...');
  } catch (err) {
    console.error('[Stellar] fundTestnetAccount error:', err);
  }
}

// Shared helper — builds, signs via Freighter v6, submits
export async function signAndSubmit(
  ownerAddress: string,
  buildFn: (account: StellarSdk.Horizon.AccountResponse) => StellarSdk.Transaction
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> {
  const account = await server.loadAccount(ownerAddress);
  const tx = buildFn(account);
  const xdr = tx.toXDR();

  const signRes = await freighterSignTx(xdr, {
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });
  if (signRes.error) {
    console.error('[Freighter] signTransaction error:', signRes.error);
    throw new Error(signRes.error.message || 'İmzalama başarısız');
  }

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signRes.signedTxXdr,
    StellarSdk.Networks.TESTNET
  );
  return server.submitTransaction(signedTx as StellarSdk.Transaction);
}

export async function mintNFT(
  ownerAddress: string,
  mediaUrl: string,
  mediaName: string,
  mediaType: 'photo' | 'audio'
): Promise<{ assetCode: string; issuer: string; txHash: string } | null> {
  const available = await isFreighterAvailable();
  if (!available) {
    console.error('[Freighter] Cannot mint NFT — extension not available');
    return null;
  }

  try {
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const assetCode = `${mediaType === 'photo' ? 'MEM' : 'SND'}${suffix}`;

    const result = await signAndSubmit(ownerAddress, account =>
      new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `NFT_${assetCode}`,
            value: JSON.stringify({
              type: mediaType,
              url: mediaUrl.substring(0, 60),
              name: mediaName.substring(0, 20),
              ts: Date.now(),
            }).substring(0, 64),
          })
        )
        .setTimeout(30)
        .build() as StellarSdk.Transaction
    );

    console.info('[Stellar] NFT minted — asset:', assetCode, '— tx:', result.hash);
    return { assetCode, issuer: ownerAddress, txHash: result.hash };
  } catch (err) {
    console.error('[Stellar] mintNFT error:', err);
    return null;
  }
}

export function getStellarExpertUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
