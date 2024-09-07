import { useEthereum } from '../../hooks/useEthereum';
import { useContracts } from '../../hooks/useContracts';
import { getAddress } from 'ethers';
import { AclOptions, Poll, PollManager } from "../../types"
import { encryptJSON } from '../../utils/crypto.demo';
import { Pinata } from '../../utils/Pinata';
import {
  xchain_ChainNamesToChainId,
  tokenDetailsFromProvider,
  xchainRPC,
  isERCTokenContract,
  guessStorageSlot
} from '@oasisprotocol/side-dao-contracts';
import { useCallback } from 'react';
import {
  VITE_CONTRACT_ACL_ALLOWALL,
  VITE_CONTRACT_ACL_STORAGEPROOF,
  VITE_CONTRACT_ACL_TOKENHOLDER,
  VITE_CONTRACT_ACL_VOTERALLOWLIST,
} from '../../constants/config';

const chains = xchain_ChainNamesToChainId

export const useCreatePollUtils = () => {
  const eth = useEthereum()
  const { pollManagerWithSigner: daoSigner } = useContracts(eth)

  const isValidAddress = useCallback(
    (address: string) => {
      try {
        getAddress(address)
      } catch (e: any) {
        if (e.code == 'INVALID_ARGUMENT') {
          return false
        } else {
          console.log("Unknown problem:", e)
          return true
        }
      }
      return true
    }
    , []
  )

  const getACLOptions = async (): Promise<[string, AclOptions]> => {
    const acl = acl_allowAll;
    // const abi = AbiCoder.defaultAbiCoder();
    return [
      '0x', // Empty bytes is passed
      {
        address: acl,
        options: { allowAll: true },
      },
    ];
  }

  const createPoll = async (
    question: string,
    description: string,
    answers: string[],
  ) => {
    const [aclData, aclOptions] = await getACLOptions();

    const poll: Poll = {
      creator: eth.state.address!,
      name: question,
      description,
      choices: answers,
      options: {
        publishVotes: false, // publishVotes.value,
        closeTimestamp: 0, //toValue(expirationTime) ? toValue(expirationTime)!.valueOf() / 1000 : 0,
      },
      acl: aclOptions,
    };

    const { key, cipherbytes } = encryptJSON(poll);

    const ipfsHash = await Pinata.pinData(cipherbytes);
    console.log('Poll ipfsHash', ipfsHash);

    const proposalParams: PollManager.ProposalParamsStruct = {
      ipfsHash,
      ipfsSecret: key,
      numChoices: answers.length,
      publishVotes: poll.options.publishVotes,
      closeTimestamp: poll.options.closeTimestamp,
      acl: acl_allowAll, // toValue(chosenPollACL),
    };

    const createProposalTx = await daoSigner!.create(proposalParams, aclData, {
      // Provide additional subsidy
      value: 10, //toValue(subsidyAmount) ?? 0n,
    });
    console.log('doCreatePoll: creating proposal tx', createProposalTx.hash);

    const receipt = (await createProposalTx.wait())!;
    if (receipt.status !== 1) {
      throw new Error('createProposal tx receipt reported failure.');
    }
    const proposalId = receipt.logs[0].data;

    console.log('doCreatePoll: Proposal ID', proposalId);
  }

  const getSapphireTokenDetails = async (address: string) => {
    const chainId = 23294
    const rpc = xchainRPC(chainId);
    try {
      return await tokenDetailsFromProvider(getAddress(address), rpc);
    } catch {
      return undefined
    }
  }

  const isXchainToken = async (chainName: string, address: string) => {
    const chainId = chains[chainName]
    const rpc = xchainRPC(chainId);
    return await isERCTokenContract(rpc, address)
  }

  const getXchainTokenDetails = async (chainName: string, address: string) => {
    const chainId = chains[chainName]
    const rpc = xchainRPC(chainId);
    return await tokenDetailsFromProvider(getAddress(address), rpc);
  }

  const checkXchainTokenHolder = async (chainName: string, tokenAddress: string, holderAddress: string, progressCallback?: (progress: string) => void) => {
    const chainId = chains[chainName]
    const rpc = xchainRPC(chainId);
    try {
      return await guessStorageSlot(rpc, tokenAddress, holderAddress, "latest", progressCallback)
    } catch (_) {
      return undefined
    }
  }

  const getXchainBlock = async (chainName: string) => {
    const chainId = chains[chainName]
    const rpc = xchainRPC(chainId);
    return rpc.getBlock("latest");
  }

  return {
    chains,
    isValidAddress,
    getSapphireTokenDetails,
    isXchainToken,
    getXchainTokenDetails,
    checkXchainTokenHolder,
    getXchainBlock,
    createPoll,
  }

}