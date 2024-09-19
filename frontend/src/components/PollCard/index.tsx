import { Proposal } from '../../types'
import { FC, useEffect } from 'react'
import { Link } from 'react-router-dom'
import classes from './index.module.css'
import { GasRequiredIcon } from '../icons/GasRequiredIcon'
import { NoGasRequiredIcon } from '../icons/NoGasRequiredIcon'
import { SpinnerIcon } from '../icons/SpinnerIcon'
import { HourGlassIcon } from '../icons/HourGlassIcon'
import { StringUtils } from '../../utils/string.utils'
import { useExtendedPoll } from '../../hooks/useExtendedPoll'
import { PollAccessIndicatorWrapper } from './PollAccessIndicator'
import { getReason, getVerdict } from '../InputFields'
import { findTextMatches } from '../HighlightedText/text-matching'
import { getHighlightedTextHtml, HighlightedText } from '../HighlightedText'
import { dashboard, designDecisions } from '../../constants/config'
import { WarningCircleIcon } from '../icons/WarningCircleIcon'
import {
  Circumstances,
  Column,
  isPollStatusAcceptable,
  VisibilityReport,
  WantedStatus,
} from '../../pages/DashboardPage/useDashboardData'
import { useEthereum } from '../../hooks/useEthereum'
import { NOT_CHECKED } from '../../hooks/usePollPermissions'
import { motion, AnimatePresence } from 'framer-motion'

const Arrow: FC<{ className: string }> = ({ className }) => (
  <svg
    width="20"
    height="15"
    viewBox="0 0 20 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13 0.119751L11.59 1.52975L16.17 6.11975H0V8.11975H16.17L11.58 12.7098L13 14.1198L20 7.11975L13 0.119751Z"
      fill="#0500E1"
    />
  </svg>
)

const PollStatusIndicator: FC<{ active: boolean; isPastDue: boolean }> = ({ active, isPastDue }) => {
  return active ? (
    <div
      className={StringUtils.clsx(classes.pollStatusActive, 'niceLine')}
      title={isPastDue ? 'Voting has already finished.' : 'Voting is currently active.'}
    >
      Active {isPastDue && <HourGlassIcon size={'small'} />}
    </div>
  ) : (
    <div className={classes.pollStatusCompleted} title={'Poll is closed, results are available.'}>
      Completed
    </div>
  )
}

const GaslessStatusIndicator: FC<{ possible: boolean | undefined }> = ({ possible }) =>
  possible === undefined ? (
    <SpinnerIcon size={'medium'} spinning />
  ) : possible ? (
    designDecisions.hideGaslessIndicator ? undefined : (
      <NoGasRequiredIcon />
    )
  ) : (
    <GasRequiredIcon />
  )

export const PollCard: FC<{
  column: Column
  proposal: Proposal
  reportVisibility: (report: VisibilityReport) => void
  showInaccessible: boolean
  searchPatterns: string[]
  wantedStatus: WantedStatus
}> = ({ proposal, reportVisibility, column, showInaccessible, searchPatterns, wantedStatus }) => {
  const { userAddress } = useEthereum()
  const { poll, proposalId, gaslessPossible, isMine, permissions, checkPermissions, isLoading, error } =
    useExtendedPoll(proposal, {
      onDashboard: true,
    })

  const {
    id: pollId,
    proposal: { active },
    ipfsParams: {
      name,
      description,
      options: { closeTimestamp },
      // acl,
    },
  } = poll ?? {
    id: proposalId?.substring(2),
    proposal,
    ipfsParams: {
      name: '',
      description: '',
      options: {},
    },
  }

  const renderedDescription = description

  const textMatches = searchPatterns.length
    ? findTextMatches(`${name} ${renderedDescription}`, searchPatterns)
    : []
  const hasAllMatches = textMatches.length === searchPatterns.length

  const highlightedDescription =
    getHighlightedTextHtml({
      text: renderedDescription,
      patterns: searchPatterns,
    }) ?? ''

  const knownToBeInaccessible =
    !permissions.error &&
    !getVerdict(permissions.canVote, true) &&
    getReason(permissions.canVote) !== NOT_CHECKED
  const hiddenByPermissionIssues = !isMine && !showInaccessible && knownToBeInaccessible
  const correctColumn = (isMine && column === 'mine') || (!isMine && column === 'others')
  const correctStatus = isPollStatusAcceptable(proposal, wantedStatus)

  const visible = correctColumn && correctStatus && !hiddenByPermissionIssues && hasAllMatches

  useEffect(() => {
    // console.log('Will report visibility change')
    const circumstances: Circumstances = {
      wantedStatus,
      searchPatterns,
      showInaccessible,
      userAddress,
    }
    reportVisibility({
      circumstances,
      column,
      pollId: pollId!,
      visible,
    })
  }, [wantedStatus, searchPatterns, showInaccessible, userAddress, column, pollId, visible])

  const isPastDue = !!closeTimestamp && new Date().getTime() / 1000 > closeTimestamp

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          layout
          // key={pollId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to={`/polls/${pollId}`} style={{ textDecoration: 'none' }}>
            <div className={classes.pollCard}>
              <div className={classes.pollCardTop}>
                {error && (
                  <div className={'niceLine'}>
                    <WarningCircleIcon size={'large'} />
                    {error}
                  </div>
                )}
                {isLoading && (
                  <div className={'niceLine'}>
                    <SpinnerIcon size={'medium'} spinning />
                    <h4>Loading poll details...</h4>
                  </div>
                )}
                {!isLoading && !error && (
                  <h4 className={active ? classes.activePollTitle : undefined}>
                    <span>
                      <HighlightedText text={name} patterns={searchPatterns} />
                    </span>
                    {dashboard.showPermissions && (
                      <PollAccessIndicatorWrapper
                        isMine={isMine}
                        permissions={permissions}
                        isActive={active}
                        retest={checkPermissions}
                      />
                    )}
                  </h4>
                )}
                <Arrow className={active ? classes.activePollArrow : classes.passivePollArrow} />
              </div>
              <div dangerouslySetInnerHTML={{ __html: highlightedDescription }} />
              <div className={classes.pollCardBottom}>
                <PollStatusIndicator active={active} isPastDue={isPastDue} />
                {dashboard.showGasless && <GaslessStatusIndicator possible={gaslessPossible} />}
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
