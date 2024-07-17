import { InputFieldControls, InputFieldProps, useInputField } from './useInputField';
import { CoupledData, expandCoupledData, getAsArray, getNumberMessage, NumberMessageTemplate } from './util';

type TextFieldProps = Omit<InputFieldProps<string>, "initialValue"> & {
  initialValue?: string

  /**
   * Minimum length of text
   *
   * You can specify this as a number, or as an array,
   * the number first and then the error message,
   * which you can provide a string, or a function that
   * returns a string, including the specified minimum length.
   *
   * Examples:
   *      5
   *      [5, "This is too short"]
   *      [10, l => `Please use at least %{l} characters!`]
   */
  minLength?: CoupledData<number, NumberMessageTemplate>

  /**
   * Maximum length of each item
   *
   * You can specify this as a number, or as an array,
   * the number first and then the error message,
   * which you can provide a string, or a function that
   * returns a string, including the specified maximum length.
   *
   * Examples:
   *      100
   *      [40, "This is too long"]
   *      [50, l => `Please use at most %{l} characters!`]*
   */
  maxLength?: CoupledData<number, NumberMessageTemplate>
}

export type TextFieldControls = InputFieldControls<string> & {

}

export function useTextField(props: TextFieldProps): TextFieldControls {
  const {
    initialValue = "",
    validators,
  } = props

  const [minLength, tooShortMessage] = expandCoupledData(
    props.minLength,
    [1, minLength => `Please specify at least ${minLength} characters!`]
  )

  const [maxLength, tooLongMessage] = expandCoupledData(
    props.maxLength,
    [1000, maxLength => `Please specify at most ${maxLength} characters!`]
  )


  const controls = useInputField<string>(
    "text",
    {
      ...props,
      initialValue,
      validators: [
        // Check minimum length
        minLength ? ((value: string) => ((value !== "") && (value.length < minLength!))
            ? `${getNumberMessage(tooShortMessage, minLength)} (Currently: ${value.length})`
            : undefined
        ) : undefined,

        // Check maximum length
        maxLength ? ((value: string) => ((value !== "") && (value.length > maxLength!))
            ? `${getNumberMessage(tooLongMessage, maxLength)} (Currently: ${value.length})`
            : undefined
        ) : undefined,

        // Any custom validators
        ...getAsArray(validators),
      ].filter(v => !!v),
    }, {
      isEmpty: text => !text,
      isEqual: (a, b) => a === b,
    }
  )
  return {
    ...controls,
    setValue: (value) => {
      controls.clearAllProblems()
      controls.setValue(value)
    }
  }
}