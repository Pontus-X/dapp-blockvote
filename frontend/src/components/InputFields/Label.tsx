import { LabelControls } from './useLabel';
import { FC } from 'react';
import classes from "./index.module.css";
import { StringUtils } from '../../utils/string.utils';
import { checkProblems } from './util';
import { ProblemList } from './ProblemDisplay';

export const Label: FC<LabelControls> = (props) => {
  const {
    label, description, visible,
    value, allProblems, clearProblem,
    classnames,
  } = props
  if (!visible) return

  const field = (
    <div className={StringUtils.clsx(...classnames)}>
      { value }
    </div>
  )

  const rootProblems = allProblems.root || []

  const { hasWarning, hasError} = checkProblems(rootProblems)

  const wrappedField = (
    <div className={StringUtils.clsx(
      classes.textValue,
      hasError ? classes.fieldWithError : hasWarning ? classes.fieldWithWarning : '',
    )}>
      {field}
      <ProblemList problems={rootProblems} onRemove={clearProblem} />
    </div>
  )

  return (
    <div className={classes.fieldContainer}>
      {(!!label || !!description)
        ? (
          <label>
            <div className={classes.fieldLabel}>
              {label}
            </div>
            <div className={classes.fieldDescription}>
              {description}
            </div>
            {wrappedField}
          </label>
        ) : wrappedField
      }
    </div>
  )

}