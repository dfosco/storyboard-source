// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
    | `///src/prototypes`
    | `///src/prototypes/main/folder/SiloDashboard`
    | `///src/prototypes/main/folder/StartupSignup`
    | `///src/prototypes/main/folder/StartupSignup/Branding`
    | `///src/prototypes/main/folder/StartupSignup/SignupForm`
    | `///src/prototypes/viewfinder`
    | `///src/prototypes/workspace`

export type Params = {}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<
    Path,
    Params,
    ModalPath
>()
export const { redirect } = utils<Path, Params>()
