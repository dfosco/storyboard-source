---
title: Cluster Token Holder
type: transient
default: false
---

# Cluster Token

You currently **hold the cluster token** — you have speaking rights in the hub.

## What this means

- You can broadcast messages to the cluster channel via `POST /_storyboard/messages/cluster/send`.
- You can transfer the token to a peer via `POST /_storyboard/messages/cluster/token` when you want them to act autonomously.
- Other hub members cannot broadcast until they hold the token or receive a message token for a specific request.

## What this does NOT mean

- Holding the cluster token does **not** make you the leader. You **cannot** set the cluster goal or signal finality — those are leader-only actions tied to the role, not the token.
- If you are a member holding the token, use it to complete delegated work, then transfer it back to the leader.

## When you lose the token

- You will be notified via a `cluster:token:transferred` event in the channel log.
- After losing the token, wait for a message token (ordered response request) before acting.
