/**
 * @fileoverview Test-only entry point: a controllable clock and one fake per
 * external port, each able to inject the failures in the spec's 受控替身 table
 * (ADR-0001). dependency-cruiser lets only test code and the
 * `@pokernext/app/testing` wiring import this file, never `apps/web`.
 */

export {ControllableClock} from './lib/testing/controllable_clock';
export type {ControllableClockOptions} from './lib/testing/controllable_clock';
export {FakeEdgeProtection} from './lib/testing/fake_edge_protection';
export {FakeHotelConfirmationSource} from './lib/testing/fake_hotel_confirmation_source';
export type {HotelConfirmationContent} from './lib/testing/fake_hotel_confirmation_source';
export {FakeKeyManagementService} from './lib/testing/fake_key_management';
export {FakeNotificationSender} from './lib/testing/fake_notification_sender';
export {FakeOcrProvider} from './lib/testing/fake_ocr_provider';
export {createFakePorts} from './lib/testing/fake_ports';
export type {FakeExternalPorts} from './lib/testing/fake_ports';
export {FakePointsWorkbookSource} from './lib/testing/fake_points_workbook_source';
export type {PointsWorkbookContent} from './lib/testing/fake_points_workbook_source';
export type {InjectionOptions} from './lib/testing/injection';
