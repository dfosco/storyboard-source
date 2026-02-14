// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/Dashboard`
  | `/Forms`
  | `/Issues`
  | `/Overview`
  | `/Repositories`
  | `/SecurityAdvisory`
  | `/Signup`
  | `/posts`
  | `/posts/:slug`

export type Params = {
  '/posts/:slug': { slug: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
