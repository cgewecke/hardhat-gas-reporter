import type { Sniffer } from "./providers";

export function createEGRDataCollectionSniffer(mochaConfig: any): Sniffer {
  return async function({ args, provider, result }) {
    // Truffle
    if (args.method === "eth_getTransactionReceipt") {
      const receipt: any = await result;
      if (receipt?.status && receipt?.transactionHash) {
        const tx = await provider.request({
          method: "eth_getTransactionByHash",
          params: [receipt.transactionHash],
        });
        await mochaConfig.attachments.recordTransaction(receipt, tx);
      }

      // Ethers: will get run twice for deployments (e.g both receipt and txhash are fetched)
    } else if (args.method === "eth_getTransactionByHash") {
      const receipt: any = await provider.request({
        method: "eth_getTransactionReceipt",
        params: args.params,
      });
      const tx = await result;
      if (receipt?.status) {
        await mochaConfig.attachments.recordTransaction(receipt, tx);
      }

      // Waffle: This is necessary when using Waffle wallets. eth_sendTransaction fetches the
      // transactionHash as part of its flow, eth_sendRawTransaction *does not*.
    } else if (args.method === "eth_sendRawTransaction") {
      const txHash = await result;

      if (typeof txHash === "string") {
        const tx = await provider.request({
          method: "eth_getTransactionByHash",
          params: [txHash],
        });
        const receipt: any = await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt?.status) {
          await mochaConfig.attachments.recordTransaction(
            receipt,
            tx
          );
        }
      }
      // Viem
    } else if (args.method === "eth_sendTransaction") {
      const txHash = await result;

      if (typeof txHash === "string") {
        const tx = await provider.request({
          method: "eth_getTransactionByHash",
          params: [txHash],
        });
        const receipt: any = await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt?.status) {
          await mochaConfig.attachments.recordTransaction(
            receipt,
            tx
          );
        }
      }
    }
  };
}
