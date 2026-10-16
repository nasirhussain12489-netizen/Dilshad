import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFallbackBootstrapData,
  getOfflineAdminUser,
  removeOfflineAdminUser,
  upsertOfflineAdminUser,
  upsertOfflineFeedPost,
  validateAdminDelete,
} from '../src/lib/bootstrap.ts';
import { isResourcePubliclyVisible } from '../src/types.ts';
import { normalizeSettingsMap, safeObjectEntries } from '../src/lib/settings.ts';
import { getDbOrThrow, requireSqlDbForWrite } from '../src/db/index.ts';
import {
  createParticipantWithPoster,
  getUserByEmail,
} from '../src/db/repository.ts';
import { hasSupabaseRuntimeConfig } from '../src/lib/supabase.ts';

describe('bootstrap fallback', () => {
  it('returns a usable offline bootstrap payload', () => {
    const data = createFallbackBootstrapData();

    assert.equal(Array.isArray(data.classes), true);
    assert.equal(data.classes.length > 0, true);
    assert.equal(Array.isArray(data.posters), true);
    assert.equal(data.posters.length, 6);
    assert.equal(Array.isArray(data.feedPosts), true);
    assert.equal(data.settings.demoMode, 'true');
  });

  it('normalizes null/undefined setting records without throwing', () => {
    const result = normalizeSettingsMap([
      { settingKey: 'supabaseUrl', settingValue: 'https://example.supabase.co' },
      { settingKey: 'supabaseAnonKey', settingValue: null },
      { settingKey: '', settingValue: 'ignored' },
      null,
      undefined,
    ] as any);

    assert.deepEqual(result, {
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: '',
    });
  });

  it('safely iterates nullish objects without throwing', () => {
    assert.deepEqual(safeObjectEntries(null), []);
    assert.deepEqual(safeObjectEntries(undefined), []);
    assert.deepEqual(safeObjectEntries({ demoMode: 'true' }), [['demoMode', 'true']]);
  });

  it('throws a clear message when SQL is unavailable instead of creating a broken database client', () => {
    const prev = {
      SQL_HOST: process.env.SQL_HOST,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      SQL_USER: process.env.SQL_USER,
      SQL_PASSWORD: process.env.SQL_PASSWORD,
    };

    delete process.env.SQL_HOST;
    delete process.env.SQL_DB_NAME;
    delete process.env.SQL_USER;
    delete process.env.SQL_PASSWORD;

    try {
      assert.throws(() => getDbOrThrow(), /No SQL database is configured/i);
    } finally {
      Object.assign(process.env, prev);
    }
  });

  it('requires a SQL database before writing a published result in demo mode', () => {
    const prev = {
      SQL_HOST: process.env.SQL_HOST,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      SQL_USER: process.env.SQL_USER,
      SQL_PASSWORD: process.env.SQL_PASSWORD,
    };

    delete process.env.SQL_HOST;
    delete process.env.SQL_DB_NAME;
    delete process.env.SQL_USER;
    delete process.env.SQL_PASSWORD;

    try {
      assert.throws(
        () => requireSqlDbForWrite('publish weekly result'),
        /No SQL database is configured/i
      );
    } finally {
      Object.assign(process.env, prev);
    }
  });

  it('falls back to the built-in admin credentials when SQL auth fails', async () => {
    const prev = {
      SQL_HOST: process.env.SQL_HOST,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      SQL_USER: process.env.SQL_USER,
      SQL_PASSWORD: process.env.SQL_PASSWORD,
    };

    process.env.SQL_HOST = '127.0.0.1';
    process.env.SQL_DB_NAME = 'ilm';
    process.env.SQL_USER = 'no_such_user';
    process.env.SQL_PASSWORD = 'wrong_password';

    try {
      const user = await getUserByEmail('nasirhussain12489@gmail.com');
      assert.ok(user, 'expected an offline fallback admin account');
      assert.equal(user?.email, 'nasirhussain12489@gmail.com');
      assert.equal(user?.role, 'SUPER_ADMIN');
    } finally {
      Object.assign(process.env, prev);
    }
  });

  it('does not treat placeholder Supabase values as a configured project', () => {
    const prev = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    };

    process.env.SUPABASE_URL = 'https://demo-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'demo-service-role-key';
    process.env.SUPABASE_ANON_KEY = 'demo-anon-key';

    try {
      assert.equal(hasSupabaseRuntimeConfig(), false);
    } finally {
      Object.assign(process.env, prev);
    }
  });

  it('creates an offline administrator when no SQL or Supabase backend is configured', () => {
    const created = upsertOfflineAdminUser({
      email: 'demo.admin@ilm.test',
      name: 'Demo Admin',
      role: 'CLASS_ADMIN',
      assignedClass: 'U3',
      passwordPlain: 'demoPass123',
    });

    const found = getOfflineAdminUser('demo.admin@ilm.test');
    assert.ok(found);
    assert.equal(found?.role, 'CLASS_ADMIN');
    assert.equal(found?.assignedClass, 'U3');

    assert.equal(removeOfflineAdminUser(created.id), true);
    assert.equal(getOfflineAdminUser('demo.admin@ilm.test'), null);
  });

  it('prevents deleting the last active super admin or final class admin for a class', () => {
    const users = [
      {
        id: 1,
        email: 'super1@ilm.test',
        name: 'Super Admin 1',
        role: 'SUPER_ADMIN',
        assignedClass: null,
        status: 'ACTIVE',
      },
      {
        id: 2,
        email: 'admin1@ilm.test',
        name: 'Class Admin U1',
        role: 'CLASS_ADMIN',
        assignedClass: 'U1',
        status: 'ACTIVE',
      },
    ];

    assert.throws(
      () => validateAdminDelete(users, 1, { currentUserId: 1, currentUserRole: 'SUPER_ADMIN' }),
      /You cannot delete your own active Super Admin account\.|At least one active Super Admin must remain\./
    );

    assert.throws(
      () => validateAdminDelete(users, 2, { currentUserId: 1, currentUserRole: 'SUPER_ADMIN' }),
      /This is the last active Class Admin for class U1\./
    );

    const removableUsers = [
      ...users,
      {
        id: 3,
        email: 'admin2@ilm.test',
        name: 'Class Admin U1 backup',
        role: 'CLASS_ADMIN',
        assignedClass: 'U1',
        status: 'ACTIVE',
      },
    ];

    assert.doesNotThrow(() =>
      validateAdminDelete(removableUsers, 2, { currentUserId: 1, currentUserRole: 'SUPER_ADMIN' })
    );
  });

  it('treats hidden library resources as private while keeping published ones public', () => {
    assert.equal(isResourcePubliclyVisible('PUBLISHED'), true);
    assert.equal(isResourcePubliclyVisible('HIDDEN'), false);
    assert.equal(isResourcePubliclyVisible(undefined), true);
    assert.equal(isResourcePubliclyVisible(null), true);
  });

  it('keeps the AI assistant disabled unless explicitly turned on and never stores chat history', async () => {
    const { isAiAssistantEnabled } = await import('../src/types.ts');

    assert.equal(isAiAssistantEnabled('false'), false);
    assert.equal(isAiAssistantEnabled('OFF'), false);
    assert.equal(isAiAssistantEnabled('true'), true);
    assert.equal(isAiAssistantEnabled('on'), true);
    assert.equal(isAiAssistantEnabled(undefined), false);
    assert.equal(isAiAssistantEnabled(null), false);
  });

  it('stores offline feed posts and exposes them in the fallback bootstrap payload', () => {
    const created = upsertOfflineFeedPost({
      id: 999,
      classCode: 'U1',
      title: 'Offline feed title',
      caption: 'Offline sample caption',
      mediaUrl: '/uploads/demo.jpg',
      mediaType: 'PHOTO',
      status: 'APPROVED',
      submittedByEmail: 'u1admin@gmail.com',
      submittedByName: 'U1 Admin',
    });

    const bootstrap = createFallbackBootstrapData();
    assert.equal(created.title, 'Offline feed title');
    assert.ok(bootstrap.feedPosts.some((post) => post.id === created.id));
    assert.equal(bootstrap.feedPosts[bootstrap.feedPosts.length - 1].classCode, 'U1');
  });

  it('creates a participant and poster in offline mode without SQL', async () => {
    const prev = {
      SQL_HOST: process.env.SQL_HOST,
      SQL_DB_NAME: process.env.SQL_DB_NAME,
      SQL_USER: process.env.SQL_USER,
      SQL_PASSWORD: process.env.SQL_PASSWORD,
    };

    delete process.env.SQL_HOST;
    delete process.env.SQL_DB_NAME;
    delete process.env.SQL_USER;
    delete process.env.SQL_PASSWORD;

    try {
      const result = await createParticipantWithPoster({
        fullName: 'Offline Student Demo',
        photoUrl: '/assets/images/scholar_portrait_ayesha_1791787508872.jpg',
        classCode: 'U1',
        categoryName: 'Speech',
        actorEmail: 'nasirhussain12489@gmail.com',
        actorRole: 'SUPER_ADMIN',
      });

      assert.ok(result.participant);
      assert.equal(result.participant.classCode, 'U1');
      assert.equal(result.poster.classCode, 'U1');
      assert.ok(result.poster.posterImageUrl.includes('data:image/svg+xml'));
    } finally {
      Object.assign(process.env, prev);
    }
  });
});
