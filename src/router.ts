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
  | `/issues`
  | `/issues/:id`
  | `/posts`
  | `/posts/:id`
  | `/viewfinder`

export type Params = {
  '/issues/:id': { id: string }
  '/posts/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
