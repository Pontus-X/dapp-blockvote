import { FC, useCallback } from 'react'
import classes from './index.module.css'
import { Button } from '../../components/Button'
import { PollData } from './hook'
import { abbrAddr } from '../../utils/crypto.demo'
import { formatEther, parseEther } from 'ethers'
import { ConnectWallet } from '../../components/ConnectWallet'
import { Card } from '../../components/Card'
import { SocialShares } from '../../components/SocialShares'
import { getVerdict, getReason, InputFieldGroup } from '../../components/InputFields'
import { PollAccessIndicatorWrapper } from '../../components/PollCard/PollAccessIndicator'
import { designDecisions, nativeTokenSymbol } from '../../constants/config'
import { SpinnerIcon } from '../../components/icons/SpinnerIcon'
import { AnimatePresence } from 'framer-motion'
import { MotionDiv } from '../../components/Animations'
import { MarkdownBlock } from '../../components/Markdown'
import { StringUtils } from '../../utils/string.utils'
import { MaybeWithTooltip } from '../../components/Tooltip/MaybeWithTooltip'

export const ActivePoll: FC<PollData> = ({
  hasWallet,
  walletLabel,
  poll,
  remainingTime,
  remainingTimeLabel,
  selectedChoice,
  canSelect,
  setSelectedChoice,
  gaslessEnabled,
  gaslessLabel,
  gvAddresses,
  gvBalances,
  voteAction,
  isVoting,
  isMine,
  permissions,
  permissionsPending,
  checkPermissions,
  completePoll,
  destroyPoll,
  topUp,
  correctiveAction,
  publishVotesLabel,
  publishVotersLabel,
  resultsLabel,
}) => {
  const { name, description, choices } = poll!.ipfsParams

  const handleSelect = useCallback(
    (index: number) => {
      if (canSelect) {
        if (selectedChoice === BigInt(index)) {
          void setSelectedChoice(undefined)
        } else {
          void setSelectedChoice(BigInt(index))
        }
      }
    },
    [canSelect, selectedChoice, setSelectedChoice],
  )

  const handleTopup = (address: string) => {
    const amountString = window.prompt(
      `Topup voting subsidy account:\n\n  ${address}\n\nAmount (in ${nativeTokenSymbol}):`,
      '1',
    )
    if (!amountString) return
    const amount = parseEther(amountString)
    if (amount > 0n) {
      // console.log("Should topup", address, amount)
      void topUp(address, amount)
    }
  }

  const isPastDue = !!remainingTime?.isPastDue

  const { canVote: canAclVote, explanation: aclExplanation } = permissions

  const canVote = getVerdict(canAclVote, false)
  // console.log("selected:", selectedChoice, "can select?", canSelect, "can Vote?", canVote, "voting?", isVoting)
  return (
    <Card className={classes.darkCard}>
      <h2>
        <div className={'niceLine'}>
          {name}
          {hasWallet && (
            <PollAccessIndicatorWrapper
              isMine={isMine}
              permissions={permissions}
              isActive={true}
              retest={checkPermissions}
              hideRestrictedNoAccess={true}
            />
          )}
        </div>
      </h2>
      <h4>{description}</h4>
      {(hasWallet || isPastDue) && (
        <AnimatePresence initial={false}>
          {choices.map((choice, index) =>
            !isVoting || selectedChoice === BigInt(index) ? (
              <MotionDiv
                reason={'voting'}
                layout
                animate={{ opacity: 1, height: 48, width: '100%' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                key={`choice-${index}`}
                className={StringUtils.clsx(
                  classes.choice,
                  classes.darkChoice,
                  canSelect || BigInt(index) === selectedChoice
                    ? classes.activeChoice
                    : classes.disabledChoice,
                  selectedChoice?.toString() === index.toString() ? classes.selectedChoice : undefined,
                )}
                onClick={() => handleSelect(index)}
              >
                <div className={classes.above}>{choice}</div>
                {!designDecisions.showSubmitButton && isVoting && <SpinnerIcon spinning height="30" />}
              </MotionDiv>
            ) : undefined,
          )}
        </AnimatePresence>
      )}
      <InputFieldGroup
        fields={[walletLabel, remainingTimeLabel, publishVotesLabel, publishVotersLabel, resultsLabel]}
        expandHorizontally={false}
      />
      {hasWallet && !canVote ? (
        <AnimatePresence>
          <MaybeWithTooltip overlay={correctiveAction ? 'Click to check again' : undefined}>
            <div
              className={StringUtils.clsx(canVote ? undefined : classes.whyNoVote, 'niceLine')}
              key={'warning-message'}
              onClick={() => {
                if (correctiveAction) {
                  console.log('Retrying')
                  correctiveAction()
                } else {
                  console.log('no corrective action')
                }
              }}
            >
              {permissionsPending && <SpinnerIcon size={'medium'} spinning />}
              <MarkdownBlock
                mainTag={'h4'}
                code={`You can't vote on this poll, since ${getReason(canAclVote) as string}.`}
              />
            </div>
          </MaybeWithTooltip>
        </AnimatePresence>
      ) : (
        aclExplanation && (
          <div className={canVote ? undefined : classes.whyNoVote}>
            <MarkdownBlock code={aclExplanation} mainTag={'h4'} />
            {canVote && <h4>You have access.</h4>}
          </div>
        )
      )}
      <InputFieldGroup
        fields={[[gaslessLabel, voteAction, completePoll, destroyPoll]]}
        expandHorizontally={false}
      />
      {!hasWallet && !isPastDue && (
        <ConnectWallet mobileSticky={false} buttonSize={'small'} avoidButtonClasses={true} />
      )}
      {isMine && gaslessEnabled && hasWallet && (
        <div>
          <h4>Gasless voting enabled:</h4>
          <div>
            {gvAddresses.map((address, index) => (
              <div key={`gvAddress-${index}`} className={'niceLine'}>
                {`${abbrAddr(address)} (${formatEther(gvBalances[index])} ${nativeTokenSymbol})`}
                {!isPastDue && (
                  <Button
                    data-address={address}
                    size={'small'}
                    color={'secondary'}
                    onClick={() => handleTopup(address)}
                  >
                    Topup
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <SocialShares
        label={'Share poll on'}
        className="socialOnDark"
        name={name}
        introText={'Vote here!'}
        pageTitle={name}
      />
    </Card>
  )
}
