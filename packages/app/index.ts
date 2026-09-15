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
export type {AccountSummary, AccountUseCases} from './lib/accounts';
export {createApp, createAppFromEnvironment} from './lib/app';
export type {App, AppDependencies, AppEnvironment} from './lib/app';
export type {
  HealthCheck,
  HealthCheckRecorded,
  HealthCheckRejected,
  HealthCheckUseCases,
  ListHealthChecksRequest,
  RecordHealthCheckRequest,
} from './lib/health_check';
export type {
  EndSessionRequest,
  ResolveSessionRequest,
  SessionEndOutcome,
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
