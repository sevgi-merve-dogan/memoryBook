import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction as freighterSignTx } from '@stellar/freighter-api';

export const PROFILE_CONTRACT_ID = 'CDYEDDEYQXLYZWJ4Z5HXAPE77PNUA2EBMFQDN7IEOVIFK62UINXDP2PW';
const SOROBAN_URL = 'https://soroban-testnet.stellar.org';

function getSorobanServer() {
  return new StellarSdk.rpc.Server(SOROBAN_URL);
}

export interface OnChainProfile {
  username: string;
  photo_hash: string;
  updated_at: number;
}

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = encoder.encode(data);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function setProfileOnChain(
  ownerAddress: string,
  username: string,
  photoHash: string,
): Promise<string> {
  const server = getSorobanServer();
  const contract = new StellarSdk.Contract(PROFILE_CONTRACT_ID);
  const account = await server.getAccount(ownerAddress);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'set_profile',
        StellarSdk.Address.fromString(ownerAddress).toScVal(),
        StellarSdk.nativeToScVal(username, { type: 'string' }),
        StellarSdk.nativeToScVal(photoHash, { type: 'string' }),
      )
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simülasyon hatası: ${(sim as StellarSdk.rpc.Api.SimulateTransactionErrorResponse).error}`);
  }

  const assembled = StellarSdk.rpc.assembleTransaction(tx, sim).build();

  const signRes = await freighterSignTx(assembled.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });
  if (signRes.error) throw new Error(signRes.error.message || 'İmzalama başarısız');

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signRes.signedTxXdr,
    StellarSdk.Networks.TESTNET,
  ) as StellarSdk.Transaction;

  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') throw new Error('İşlem gönderilemedi');

  let attempts = 0;
  while (attempts < 24) {
    await new Promise(r => setTimeout(r, 1500));
    const txResult = await server.getTransaction(sendResult.hash);
    if (txResult.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) return sendResult.hash;
    if (txResult.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) throw new Error('İşlem başarısız oldu');
    attempts++;
  }
  throw new Error('İşlem zaman aşımına uğradı');
}

export async function getProfileFromChain(ownerAddress: string): Promise<OnChainProfile | null> {
  try {
    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(PROFILE_CONTRACT_ID);
    const account = await server.getAccount(ownerAddress);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'get_profile',
          StellarSdk.Address.fromString(ownerAddress).toScVal(),
        )
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(sim)) return null;

    const successSim = sim as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse;
    if (!successSim.result?.retval) return null;

    const val = successSim.result.retval;
    if (val.switch().name === 'scvVoid') return null;

    const native = StellarSdk.scValToNative(val) as Record<string, unknown>;
    if (!native) return null;

    return {
      username: String(native.username ?? ''),
      photo_hash: String(native.photo_hash ?? ''),
      updated_at: Number(native.updated_at ?? 0),
    };
  } catch {
    return null;
  }
}
