// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
    | `///src/prototypes`
    | `///src/prototypes/main/folder/Example`
    | `///src/prototypes/main/folder/Example/Forms`
    | `///src/prototypes/main/folder/Example/posts`
    | `///src/prototypes/main/folder/Example/posts/:id`
    | `///src/prototypes/main/folder/Signup`
    | `///src/prototypes/main/folder/Signup/Dashboard`
    | `///src/prototypes/main/folder/Signup/templates/CloudApp/Application`
    | `///src/prototypes/viewfinder`
    | `///src/prototypes/workspace`

export type Params = {
    '///src/prototypes/main/folder/Example/posts/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<
    Path,
    Params,
    ModalPath
>()
export const { redirect } = utils<Path, Params>()
