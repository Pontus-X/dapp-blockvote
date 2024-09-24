export type ProblemLevel = 'warning' | 'error'

export type Problem = {
  signature?: string
  message: string
  level?: ProblemLevel
}

export type ProblemReport = Problem & { location?: string }
export type ProblemAtLocation = Problem & { location: string }

type ValidatorProduct = ProblemReport | string | undefined

export const wrapProblem = (
  problem: ValidatorProduct,
  defaultLocation: string,
  defaultLevel: ProblemLevel,
): ProblemAtLocation | undefined => {
  if (problem === undefined || problem === '') return undefined
  if (typeof problem === 'string') {
    const cutPos = problem.indexOf(':')
    if (cutPos !== -1) {
      let signature = problem.substring(0, cutPos)
      if (!signature.includes(' ')) {
        return {
          signature,
          message: problem.substring(cutPos + 1).trim(),
          level: defaultLevel,
          location: defaultLocation,
        }
      }
    }
    return {
      message: problem,
      level: defaultLevel,
      location: defaultLocation,
    }
  } else {
    const report = problem as ProblemReport
    return {
      ...report,
      level: report.level ?? 'error',
      location: report.location ?? defaultLocation,
    }
  }
}

export function flatten<Data>(array: Data[][]): Data[] {
  const result: Data[] = []
  array.forEach(a => a.forEach(i => result.push(i)))
  return result
}

export type AllProblems = Record<string, Problem[]>

export type ValidatorControls = {
  isStillFresh: () => boolean
  updateStatus: (status: { message?: string; progress?: number }) => void
}

export type SyncValidatorFunction<DataType> = (
  value: DataType,
  changed: boolean,
  controls: ValidatorControls,
  reason: string,
) => SingleOrArray<ValidatorProduct>
export type AsyncValidatorFunction<DataType> = (
  value: DataType,
  changed: boolean,
  controls: ValidatorControls,
  reason: string,
) => Promise<SingleOrArray<ValidatorProduct>>
export type ValidatorFunction<DataType> = SyncValidatorFunction<DataType> | AsyncValidatorFunction<DataType>

export const checkProblems = (problems: Problem[] = []) => ({
  hasWarning: problems.some(problem => problem.level === 'warning'),
  hasError: problems.some(problem => problem.level === 'error'),
})

export type SingleOrArray<Data> = Data | Data[]

export function getAsArray<Data>(data: SingleOrArray<Data>): Data[] {
  return Array.isArray(data) ? data : [data]
}

export const thereIsOnly = (amount: number) => {
  if (!amount) {
    return 'there is none'
  } else if (amount == 1) {
    return 'there is only one'
  } else {
    return `there are only ${amount}`
  }
}

export const atLeastXItems = (amount: number): string => {
  if (amount > 1) {
    return `at least ${amount} items`
  } else if (amount === 1) {
    return `at least one item`
  } else {
    throw new Error(`What do you mean by 'at least ${amount} items??'`)
  }
}

type NumberStringFunction = (amount: number) => string
export type NumberMessageTemplate = string | NumberStringFunction

export const getNumberMessage = (template: NumberMessageTemplate, amount: number): string =>
  typeof template === 'string' ? (template as string) : (template as NumberStringFunction)(amount)

type DateStringFunction = (date: Date) => string
export type DateMessageTemplate = string | DateStringFunction

export const getDateMessage = (template: DateMessageTemplate, date: Date): string =>
  typeof template === 'string' ? (template as string) : (template as DateStringFunction)(date)

/**
 * Get the indices of duplicate elements in an array
 */
export const findDuplicates = (
  values: string[],
  normalize?: (value: string) => string,
): [number[], number[]] => {
  const matches: Record<string, number> = {}
  const hasDuplicates = new Set<number>()
  const duplicates = new Set<number>()
  values.forEach((value, index) => {
    const key = normalize ? normalize(value) : value
    if (matches[key] !== undefined) {
      hasDuplicates.add(matches[value])
      duplicates.add(index)
    } else {
      matches[key] = index
    }
  })
  return [Array.from(hasDuplicates.values()), Array.from(duplicates.values())]
}

type SimpleDecision = boolean
type FullDecision = { verdict: boolean; reason?: string }
export type Decision = SimpleDecision | FullDecision

type FullPositiveDecision = { verdict: boolean; reason?: string }
type FullNegativeDecision = { verdict: boolean; reason: string }
export type DecisionWithReason = true | FullPositiveDecision | FullNegativeDecision

export const allow = (reason?: string): Decision => ({ verdict: true, reason })

export const deny = (reason?: string): Decision => ({ verdict: false, reason })
export const denyWithReason = (reason: string): FullNegativeDecision => ({ verdict: false, reason })

export const expandDecision = (decision: Decision): FullDecision =>
  typeof decision === 'boolean' ? { verdict: decision } : decision

export const invertDecision = (decision: Decision): Decision => {
  const { verdict, reason } = expandDecision(decision)
  return {
    verdict: !verdict,
    reason,
  }
}

export const andDecisions = (a: Decision, b: Decision): Decision => {
  const aVerdict = getVerdict(a, false)
  const bVerdict = getVerdict(b, false)
  if (aVerdict) {
    if (bVerdict) {
      return {
        verdict: true,
        reason: getReason(a) + '; ' + getReason(b),
      }
    } else {
      return b
    }
  } else {
    return a
  }
}

export const getVerdict = (decision: Decision | undefined, defaultVerdict: boolean): boolean =>
  decision === undefined ? defaultVerdict : typeof decision === 'boolean' ? decision : decision.verdict

export const getReason = (decision: Decision | undefined): string | undefined =>
  decision === undefined ? undefined : typeof decision === 'boolean' ? undefined : decision.reason

export const getReasonForDenial = (decision: Decision | undefined): string | undefined =>
  decision === undefined
    ? undefined
    : typeof decision === 'boolean' || decision.verdict
      ? undefined
      : decision.reason

export const getReasonForAllowing = (decision: Decision | undefined): string | undefined =>
  decision === undefined
    ? undefined
    : typeof decision === 'boolean' || !decision.verdict
      ? undefined
      : decision.reason

export type CoupledData<FirstType = boolean, SecondType = string> = [FirstType, SecondType] | FirstType

export function expandCoupledData<FirstType, SecondType>(
  value: CoupledData<FirstType, SecondType> | undefined,
  fallback: [FirstType, SecondType],
): [FirstType, SecondType] {
  if (value === undefined) {
    return fallback
  } else if (Array.isArray(value)) {
    return value
  } else {
    return [value, fallback[1]]
  }
}
