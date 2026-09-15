/**
 * @fileoverview `/?page=player-home&state=ready|empty`: the DESIGN.md §3.1
 * player home composed from the public components with prototype demo copy.
 * `ready` is Alex's Jeju trip; `empty` is a member with no trip and no
 * points record.
 */

import {Coins, Luggage} from 'lucide-react';

import {
  AppHeader,
  BottomNav,
  Button,
  ContactRow,
  EmptyState,
  HeroTripCard,
  PlayerShell,
  PointsPanel,
  StatusStrip,
} from '../../index';
import type {BottomNavItem} from '../../index';
import type {KitchenSinkPageProps} from '../page_types';
import {jejuNightPlaceholderSrc} from './jeju_night_placeholder';
import {
  PLAYER_HOME_COMMON,
  PLAYER_HOME_EMPTY,
  PLAYER_HOME_READY,
} from './player_home_copy';
import styles from './player_home_page.module.css';

// Links stay on this page; the real routes belong to ticket 13.
const NAV_HREFS: Readonly<Record<BottomNavItem, string>> = {
  home: '?page=player-home',
  trips: '?page=player-home',
  qr: '?page=player-home',
  points: '?page=player-home',
  account: '?page=player-home',
};

/** Renders Alex's home with the Jeju trip. */
function ReadyHome() {
  const copy = PLAYER_HOME_READY;
  return (
    <>
      <HeroTripCard
        header={<AppHeader hasUnreadNotifications />}
        greeting={PLAYER_HOME_COMMON.greeting}
        destination={copy.destination}
        destinationEn={copy.destinationEn}
        dates={copy.dates}
        actionLabel={copy.tripAction}
        // Local stand-in for a destination photo: no network at runtime.
        image={{src: jejuNightPlaceholderSrc(), alt: ''}}
      />
      <StatusStrip
        place={copy.hotel}
        lodging={copy.lodging}
        transfer={copy.transfer}
        itinerary={copy.itinerary}
      />
      <PointsPanel
        available={copy.availablePoints}
        reserved={copy.reservedPoints}
      />
      <ContactRow
        label={copy.contactLabel}
        name={copy.contactName}
        detail={copy.contactDetail}
        action={<Button variant="ghost">{copy.contactAction}</Button>}
      />
    </>
  );
}

/** Renders the home of a member with no trip and no points record. */
function EmptyHome() {
  const copy = PLAYER_HOME_EMPTY;
  return (
    <>
      <AppHeader />
      <p className={styles['greeting']}>{PLAYER_HOME_COMMON.greeting}</p>
      <EmptyState
        icon={Luggage}
        reason={copy.noTripReason}
        action={
          <Button variant="secondary" size="lg">
            {copy.applyAction}
          </Button>
        }
      />
      <div className={styles['divider']} />
      <EmptyState icon={Coins} reason={copy.noPointsReason} />
    </>
  );
}

/** Renders the player home kitchen-sink page. */
export function PlayerHomePage({params}: KitchenSinkPageProps) {
  const isEmpty = params.get('state') === 'empty';
  return (
    <PlayerShell navigation={<BottomNav current="home" hrefs={NAV_HREFS} />}>
      {isEmpty ? <EmptyHome /> : <ReadyHome />}
    </PlayerShell>
  );
}
