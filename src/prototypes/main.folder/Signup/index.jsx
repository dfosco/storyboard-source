import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormControl, TextInput, Select, Checkbox, Text } from '@primer/react'
import { useOverride } from '@dfosco/storyboard-react'
import styles from './Signup.module.css'

const steps = ['Account', 'Organization', 'Workspace', 'Review']

function asString(value) {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value) {
  return value === true || value === 'true'
}

/**
 * Uncontrolled text field that only persists to the hash on blur.
 * Uses key={defaultValue} to reset when navigating back to a step.
 */
function BlurTextField({ name, defaultValue, onCommit, type = 'text', placeholder }) {
  const ref = useRef(defaultValue)
  return (
    <TextInput
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={(e) => { ref.current = e.target.value }}
      onBlur={() => onCommit(ref.current)}
      block
    />
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [stepParam, setStepParam] = useOverride('signup.step')
  const stepIndex = Math.min(Math.max(parseInt(stepParam, 10) || 0, 0), steps.length - 1)
  const setStepIndex = (valOrFn) => {
    const next = typeof valOrFn === 'function' ? valOrFn(stepIndex) : valOrFn
    setStepParam(String(next))
  }
  const [errFullName, setErrFullName, clearErrFullName] = useOverride('signup.errors.fullName')
  const [errEmail, setErrEmail, clearErrEmail] = useOverride('signup.errors.email')
  const [errPassword, setErrPassword, clearErrPassword] = useOverride('signup.errors.password')
  const [errOrgName, setErrOrgName, clearErrOrgName] = useOverride('signup.errors.orgName')
  const [errOrgSize, setErrOrgSize, clearErrOrgSize] = useOverride('signup.errors.orgSize')
  const [errRole, setErrRole, clearErrRole] = useOverride('signup.errors.role')
  const [errRegion, setErrRegion, clearErrRegion] = useOverride('signup.errors.region')
  const [errPlan, setErrPlan, clearErrPlan] = useOverride('signup.errors.plan')
  const [errAgreeTerms, setErrAgreeTerms, clearErrAgreeTerms] = useOverride('signup.errors.agreeTerms')

  const errors = {
    fullName: errFullName, email: errEmail, password: errPassword,
    orgName: errOrgName, orgSize: errOrgSize, role: errRole,
    region: errRegion, plan: errPlan, agreeTerms: errAgreeTerms,
  }
  const errorSetters = {
    fullName: setErrFullName, email: setErrEmail, password: setErrPassword,
    orgName: setErrOrgName, orgSize: setErrOrgSize, role: setErrRole,
    region: setErrRegion, plan: setErrPlan, agreeTerms: setErrAgreeTerms,
  }
  const errorClears = {
    fullName: clearErrFullName, email: clearErrEmail, password: clearErrPassword,
    orgName: clearErrOrgName, orgSize: clearErrOrgSize, role: clearErrRole,
    region: clearErrRegion, plan: clearErrPlan, agreeTerms: clearErrAgreeTerms,
  }
  const clearAllErrors = () => Object.values(errorClears).forEach((fn) => fn())
  const setErrors = (nextErrors) => {
    clearAllErrors()
    Object.entries(nextErrors).forEach(([key, msg]) => errorSetters[key]?.(msg))
  }

  const [fullName, setFullName] = useOverride('signup.fullName')
  const [email, setEmail] = useOverride('signup.email')
  const [password, setPassword] = useOverride('signup.password')
  const [orgName, setOrgName] = useOverride('signup.organization.name')
  const [orgSize, setOrgSize] = useOverride('signup.organization.size')
  const [role, setRole] = useOverride('signup.organization.role')
  const [region, setRegion] = useOverride('signup.workspace.region')
  const [plan, setPlan] = useOverride('signup.workspace.plan')
  const [newsletter, setNewsletter] = useOverride('signup.workspace.newsletter')
  const [agreeTerms, setAgreeTerms] = useOverride('signup.workspace.agreeTerms')

  const values = useMemo(
    () => ({
      fullName: asString(fullName),
      email: asString(email),
      password: asString(password),
      orgName: asString(orgName),
      orgSize: asString(orgSize),
      role: asString(role),
      region: asString(region),
      plan: asString(plan) || 'starter',
      newsletter: asBoolean(newsletter),
      agreeTerms: asBoolean(agreeTerms),
    }),
    [fullName, email, password, orgName, orgSize, role, region, plan, newsletter, agreeTerms],
  )

  function validateStep(index) {
    const nextErrors = {}

    if (index === 0) {
      if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required.'
      if (!values.email.trim()) nextErrors.email = 'Email is required.'
      if (!values.password.trim()) nextErrors.password = 'Password is required.'
    }

    if (index === 1) {
      if (!values.orgName.trim()) nextErrors.orgName = 'Organization name is required.'
      if (!values.orgSize.trim()) nextErrors.orgSize = 'Organization size is required.'
      if (!values.role.trim()) nextErrors.role = 'Role is required.'
    }

    if (index === 2) {
      if (!values.region.trim()) nextErrors.region = 'Region is required.'
      if (!values.plan.trim()) nextErrors.plan = 'Plan is required.'
      if (!values.agreeTerms) nextErrors.agreeTerms = 'You must accept terms to continue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goNext() {
    if (!validateStep(stepIndex)) return
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  function goBack() {
    setErrors({})
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  function completeSignup() {
    if (!validateStep(2)) {
      setStepIndex(2)
      return
    }
    navigate('/Dashboard')
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Text as="h1" size="large" weight="bold">Create your cloud account</Text>
          <Text as="p" className={styles.subtitle}>
            Complete the onboarding flow to configure your account and organization.
          </Text>
        </header>

        {/* Step indicator */}
        <nav className={styles.stepper}>
          {steps.map((title, index) => (
            <div key={title} className={`${styles.step} ${index === stepIndex ? styles.stepActive : ''} ${index < stepIndex ? styles.stepDone : ''}`}>
              <span className={styles.stepNumber}>{index < stepIndex ? '✓' : index + 1}</span>
              <span className={styles.stepLabel}>{title}</span>
            </div>
          ))}
        </nav>

        <div className={styles.card}>
          <div className={styles.fields}>
            {stepIndex === 0 && (
              <>
                <FormControl>
                  <FormControl.Label>Full name</FormControl.Label>
                  <BlurTextField
                    name="fullName"
                    defaultValue={values.fullName}
                    placeholder="Jane Doe"
                    onCommit={setFullName}
                  />
                  {errors.fullName && <FormControl.Validation variant="error">{errors.fullName}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Email</FormControl.Label>
                  <BlurTextField
                    name="email"
                    defaultValue={values.email}
                    placeholder="jane@acme.cloud"
                    onCommit={setEmail}
                  />
                  {errors.email && <FormControl.Validation variant="error">{errors.email}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Password</FormControl.Label>
                  <BlurTextField
                    name="password"
                    defaultValue={values.password}
                    onCommit={setPassword}
                    type="password"
                  />
                  {errors.password && <FormControl.Validation variant="error">{errors.password}</FormControl.Validation>}
                </FormControl>
              </>
            )}

            {stepIndex === 1 && (
              <>
                <FormControl>
                  <FormControl.Label>Organization name</FormControl.Label>
                  <BlurTextField
                    name="orgName"
                    defaultValue={values.orgName}
                    placeholder="Acme Cloud"
                    onCommit={setOrgName}
                  />
                  {errors.orgName && <FormControl.Validation variant="error">{errors.orgName}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Organization size</FormControl.Label>
                  <Select value={values.orgSize} onChange={(e) => setOrgSize(e.target.value)}>
                    <Select.Option value="">Select size</Select.Option>
                    <Select.Option value="1-10">1–10 employees</Select.Option>
                    <Select.Option value="11-50">11–50 employees</Select.Option>
                    <Select.Option value="51-250">51–250 employees</Select.Option>
                    <Select.Option value="251+">251+ employees</Select.Option>
                  </Select>
                  {errors.orgSize && <FormControl.Validation variant="error">{errors.orgSize}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Your role</FormControl.Label>
                  <Select value={values.role} onChange={(e) => setRole(e.target.value)}>
                    <Select.Option value="">Select role</Select.Option>
                    <Select.Option value="founder">Founder</Select.Option>
                    <Select.Option value="engineering-manager">Engineering Manager</Select.Option>
                    <Select.Option value="developer">Developer</Select.Option>
                    <Select.Option value="platform-admin">Platform Admin</Select.Option>
                  </Select>
                  {errors.role && <FormControl.Validation variant="error">{errors.role}</FormControl.Validation>}
                </FormControl>
              </>
            )}

            {stepIndex === 2 && (
              <>
                <FormControl>
                  <FormControl.Label>Primary region</FormControl.Label>
                  <Select value={values.region} onChange={(e) => setRegion(e.target.value)}>
                    <Select.Option value="">Select region</Select.Option>
                    <Select.Option value="us-east-1">US East</Select.Option>
                    <Select.Option value="us-west-2">US West</Select.Option>
                    <Select.Option value="eu-west-1">EU West</Select.Option>
                    <Select.Option value="ap-southeast-1">AP Southeast</Select.Option>
                  </Select>
                  {errors.region && <FormControl.Validation variant="error">{errors.region}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Starting plan</FormControl.Label>
                  <Select value={values.plan} onChange={(e) => setPlan(e.target.value)}>
                    <Select.Option value="starter">Starter</Select.Option>
                    <Select.Option value="growth">Growth</Select.Option>
                    <Select.Option value="enterprise">Enterprise</Select.Option>
                  </Select>
                  {errors.plan && <FormControl.Validation variant="error">{errors.plan}</FormControl.Validation>}
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={values.newsletter}
                    onChange={(e) => setNewsletter(e.target.checked ? 'true' : 'false')}
                  />
                  <FormControl.Label>Email me product updates and onboarding tips</FormControl.Label>
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={values.agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked ? 'true' : 'false')}
                  />
                  <FormControl.Label>I agree to the Terms of Service and Privacy Policy</FormControl.Label>
                  {errors.agreeTerms && <FormControl.Validation variant="error">{errors.agreeTerms}</FormControl.Validation>}
                </FormControl>
              </>
            )}

            {stepIndex === 3 && (
              <div className={styles.review}>
                <Text as="h2" weight="bold">Review your configuration</Text>
                <dl className={styles.reviewList}>
                  {[
                    ['Name', values.fullName],
                    ['Email', values.email],
                    ['Organization', values.orgName],
                    ['Team size', values.orgSize],
                    ['Role', values.role],
                    ['Region', values.region],
                    ['Plan', values.plan],
                    ['Newsletter', values.newsletter ? 'Yes' : 'No'],
                  ].map(([label, val]) => (
                    <div key={label} className={styles.reviewRow}>
                      <dt className={styles.reviewLabel}>{label}</dt>
                      <dd className={styles.reviewValue}>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className={styles.actions}>
              {stepIndex > 0 && (
                <Button variant="invisible" onClick={goBack}>Back</Button>
              )}
              {stepIndex < 3 && (
                <Button variant="primary" onClick={goNext}>Continue</Button>
              )}
              {stepIndex === 3 && (
                <Button variant="primary" onClick={completeSignup}>Create account</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
