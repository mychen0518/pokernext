/**
 * @fileoverview Public entry point of the use-case layer: authorization,
 * version re-checks and transactions composed over domain, db and ports
 * (ADR-0001). The only package `apps/web` may call for business behaviour.
 */

export type {
  AccountKind,
  HostKind,
  Workspace,
  WorkspaceEntryRefusal,
} from '@pokernext/domain';
export {DEFAULT_DEMO_PORT, LOCAL_HOST_NAMES} from '@pokernext/domain';
export type {AccountSummary} from './lib/accounts';
export {createApp, createAppFromEnvironment} from './lib/app';
export type {App, AppDependencies, AppEnvironment} from './lib/app';
export type {
  HealthCheck,
  HealthCheckRecorded,
  HealthCheckRejected,
  HealthCheckUseCases,
  HealthProbeFailed,
  HealthProbePassed,
  RecordHealthCheckRequest,
} from './lib/health_check';
export {parseAccountId, parseSessionToken} from './lib/identifiers';
export type {AccountId, SessionToken} from './lib/identifiers';
export type {
  EndSessionRequest,
  ResolveSessionRequest,
  SessionEndOutcome,
  SessionEndRefused,
  SessionHomeRequest,
  SessionStarted,
  SessionStartRefused,
  SessionUseCases,
  SignedIn,
  SignedOut,
  StartSessionRequest,
  WorkspaceActorSummary,
  WorkspaceEntryAllowed,
  WorkspaceEntryRefused,
} from './lib/sessions';
export {PortNotConfiguredError} from './lib/unconfigured_ports';
