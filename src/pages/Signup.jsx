import { useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Checkbox,
  FormControl,
  Reshaped,
  Select,
  Stepper,
  Text,
  TextField,
  View,
} from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useOverride } from '../storyboard'

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
function BlurTextField({ name, defaultValue, onCommit, ...props }) {
  const ref = useRef(defaultValue)
  return (
    <TextField
      name={name}
      defaultValue={defaultValue}
      onChange={({ value }) => { ref.current = value }}
      onBlur={() => onCommit(ref.current)}
      {...props}
    />
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [errors, setErrors] = useState({})

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
    <Reshaped defaultTheme="reshaped">
    <View padding={8} maxWidth={90} gap={6} direction="column" attributes={{ style: { margin: '0 auto' } }}>
      <Text variant="title-3" weight="bold">Create your cloud account</Text>
      <Text variant="body-2" color="neutral-faded">
        Complete the onboarding flow to configure your account and organization.
      </Text>

      <Stepper activeId={String(stepIndex)} gap={4}>
        {steps.map((title, index) => (
          <Stepper.Item
            key={title}
            id={String(index)}
            title={title}
            completed={index < stepIndex}
            subtitle={`Step ${index + 1}`}
          />
        ))}
      </Stepper>

      <Card padding={8}>
        <View direction="column" gap={6}>
          {stepIndex === 0 && (
            <>
              <FormControl hasError={!!errors.fullName}>
                <FormControl.Label>Full name</FormControl.Label>
                <BlurTextField
                  name="fullName"
                  defaultValue={values.fullName}
                  placeholder="Jane Doe"
                  onCommit={setFullName}
                />
                {errors.fullName && <FormControl.Error>{errors.fullName}</FormControl.Error>}
              </FormControl>

              <FormControl hasError={!!errors.email}>
                <FormControl.Label>Email</FormControl.Label>
                <BlurTextField
                  name="email"
                  defaultValue={values.email}
                  placeholder="jane@acme.cloud"
                  onCommit={setEmail}
                />
                {errors.email && <FormControl.Error>{errors.email}</FormControl.Error>}
              </FormControl>

              <FormControl hasError={!!errors.password}>
                <FormControl.Label>Password</FormControl.Label>
                <BlurTextField
                  name="password"
                  defaultValue={values.password}
                  onCommit={setPassword}
                  inputAttributes={{ type: 'password' }}
                />
                {errors.password && <FormControl.Error>{errors.password}</FormControl.Error>}
              </FormControl>
            </>
          )}

          {stepIndex === 1 && (
            <>
              <FormControl hasError={!!errors.orgName}>
                <FormControl.Label>Organization name</FormControl.Label>
                <BlurTextField
                  name="orgName"
                  defaultValue={values.orgName}
                  placeholder="Acme Cloud"
                  onCommit={setOrgName}
                />
                {errors.orgName && <FormControl.Error>{errors.orgName}</FormControl.Error>}
              </FormControl>

              <FormControl hasError={!!errors.orgSize}>
                <FormControl.Label>Organization size</FormControl.Label>
                <Select name="orgSize" value={values.orgSize} onChange={({ value }) => setOrgSize(value)}>
                  <Select.Option value="">Select size</Select.Option>
                  <Select.Option value="1-10">1-10 employees</Select.Option>
                  <Select.Option value="11-50">11-50 employees</Select.Option>
                  <Select.Option value="51-250">51-250 employees</Select.Option>
                  <Select.Option value="251+">251+ employees</Select.Option>
                </Select>
                {errors.orgSize && <FormControl.Error>{errors.orgSize}</FormControl.Error>}
              </FormControl>

              <FormControl hasError={!!errors.role}>
                <FormControl.Label>Your role</FormControl.Label>
                <Select name="role" value={values.role} onChange={({ value }) => setRole(value)}>
                  <Select.Option value="">Select role</Select.Option>
                  <Select.Option value="founder">Founder</Select.Option>
                  <Select.Option value="engineering-manager">Engineering Manager</Select.Option>
                  <Select.Option value="developer">Developer</Select.Option>
                  <Select.Option value="platform-admin">Platform Admin</Select.Option>
                </Select>
                {errors.role && <FormControl.Error>{errors.role}</FormControl.Error>}
              </FormControl>
            </>
          )}

          {stepIndex === 2 && (
            <>
              <FormControl hasError={!!errors.region}>
                <FormControl.Label>Primary region</FormControl.Label>
                <Select name="region" value={values.region} onChange={({ value }) => setRegion(value)}>
                  <Select.Option value="">Select region</Select.Option>
                  <Select.Option value="us-east-1">US East</Select.Option>
                  <Select.Option value="us-west-2">US West</Select.Option>
                  <Select.Option value="eu-west-1">EU West</Select.Option>
                  <Select.Option value="ap-southeast-1">AP Southeast</Select.Option>
                </Select>
                {errors.region && <FormControl.Error>{errors.region}</FormControl.Error>}
              </FormControl>

              <FormControl hasError={!!errors.plan}>
                <FormControl.Label>Starting plan</FormControl.Label>
                <Select name="plan" value={values.plan} onChange={({ value }) => setPlan(value)}>
                  <Select.Option value="starter">Starter</Select.Option>
                  <Select.Option value="growth">Growth</Select.Option>
                  <Select.Option value="enterprise">Enterprise</Select.Option>
                </Select>
                {errors.plan && <FormControl.Error>{errors.plan}</FormControl.Error>}
              </FormControl>

              <Checkbox
                name="newsletter"
                checked={values.newsletter}
                onChange={({ checked }) => setNewsletter(checked ? 'true' : 'false')}
              >
                Email me product updates and onboarding tips
              </Checkbox>

              <FormControl hasError={!!errors.agreeTerms}>
                <Checkbox
                  name="agreeTerms"
                  checked={values.agreeTerms}
                  onChange={({ checked }) => setAgreeTerms(checked ? 'true' : 'false')}
                >
                  I agree to the Terms of Service and Privacy Policy
                </Checkbox>
                {errors.agreeTerms && <FormControl.Error>{errors.agreeTerms}</FormControl.Error>}
              </FormControl>
            </>
          )}

          {stepIndex === 3 && (
            <View direction="column" gap={4}>
              <Text variant="title-6" weight="medium">Review your configuration</Text>
              <Text variant="body-2"><strong>Name:</strong> {values.fullName}</Text>
              <Text variant="body-2"><strong>Email:</strong> {values.email}</Text>
              <Text variant="body-2"><strong>Organization:</strong> {values.orgName}</Text>
              <Text variant="body-2"><strong>Team size:</strong> {values.orgSize}</Text>
              <Text variant="body-2"><strong>Role:</strong> {values.role}</Text>
              <Text variant="body-2"><strong>Region:</strong> {values.region}</Text>
              <Text variant="body-2"><strong>Plan:</strong> {values.plan}</Text>
              <Text variant="body-2"><strong>Newsletter:</strong> {values.newsletter ? 'Yes' : 'No'}</Text>
            </View>
          )}

          <View direction="row" justify="space-between" align="center">
            <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
              Back
            </Button>

            {stepIndex < 3 && (
              <Button color="primary" onClick={goNext}>
                Continue
              </Button>
            )}

            {stepIndex === 3 && (
              <Button color="primary" onClick={completeSignup}>
                Create account
              </Button>
            )}
          </View>
        </View>
      </Card>
    </View>
    </Reshaped>
  )
}
