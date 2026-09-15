/**
 * @fileoverview Bundles one fake of every external port.
 */

import type {Clock, ExternalPorts} from '../../index';
import {FakeEdgeProtection} from './fake_edge_protection';
import {FakeHotelConfirmationSource} from './fake_hotel_confirmation_source';
import {FakeKeyManagementService} from './fake_key_management';
import {FakeNotificationSender} from './fake_notification_sender';
import {FakeOcrProvider} from './fake_ocr_provider';
import {FakePointsWorkbookSource} from './fake_points_workbook_source';

/** The six external ports, each a fake that tests can inject failures into. */
export interface FakeExternalPorts extends ExternalPorts {
  readonly pointsWorkbooks: FakePointsWorkbookSource;
  readonly hotelConfirmations: FakeHotelConfirmationSource;
  readonly ocr: FakeOcrProvider;
  readonly keyManagement: FakeKeyManagementService;
  readonly notifications: FakeNotificationSender;
  readonly edge: FakeEdgeProtection;
}

/** Creates a fresh fake of every external port; delays run on `clock`. */
export function createFakePorts(clock: Clock): FakeExternalPorts {
  return {
    pointsWorkbooks: new FakePointsWorkbookSource(),
    hotelConfirmations: new FakeHotelConfirmationSource(),
    ocr: new FakeOcrProvider(clock),
    keyManagement: new FakeKeyManagementService(),
    notifications: new FakeNotificationSender(),
    edge: new FakeEdgeProtection(),
  };
}
