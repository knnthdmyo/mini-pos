# Feature Specification: Branding & Theme Onboarding (Store Setup)

**Feature Branch**: `003-branding-theme-onboarding`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "MVP3: Branding & Theme Onboarding (Store Setup) — Add first-time onboarding step for store branding: store name, banner/logo upload, theme preset selection, with live preview and global application across POS, Queue, and Reports."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - First-Time Store Setup (Priority: P1)

A new store owner logs in for the first time after registration. They are presented with a store setup onboarding screen where they can enter their store name, upload a banner/logo image, and select a visual theme preset. Once they save, these settings are persisted and the owner is taken to their personalized dashboard.

**Why this priority**: This is the core onboarding flow — without it, the store has no identity. It delivers the primary value of personalization and must work end-to-end before any other story matters.

**Independent Test**: Can be fully tested by creating a new user account, completing the onboarding form, and verifying settings are saved. Delivers immediate value by giving the store its identity.

**Acceptance Scenarios**:

1. **Given** a user has just logged in for the first time and has no store settings, **When** they are redirected to the dashboard, **Then** they are shown the onboarding/store setup screen instead.
2. **Given** a user is on the onboarding screen, **When** they enter a store name, upload a banner image, select a theme, and tap "Save", **Then** the settings are persisted, the onboarding screen is dismissed, and they are taken to the dashboard with their branding applied.
3. **Given** a user is on the onboarding screen, **When** they leave the store name empty and tap "Save", **Then** a validation error is shown indicating store name is required.
4. **Given** a user is on the onboarding screen, **When** they tap "Skip" or "Set up later", **Then** a default store_settings row is created (store_name = "My Store", theme = "light", banner_url = null), the onboarding is dismissed, and they proceed to the dashboard.

---

### User Story 2 - Global Branding Application (Priority: P1)

After store settings are saved (during onboarding or later via settings), the store name appears in the header of all main screens (POS, Queue, Reports, Batch, Inventory). If a banner/logo was uploaded, it is shown alongside the store name. The selected theme preset is applied across all pages.

**Why this priority**: Branding only has value if it is visible across the app. This story is co-equal with Story 1 because saved settings must render globally to complete the feature.

**Independent Test**: Can be tested by saving store settings and then navigating to POS, Queue, and Reports screens to verify the store name, banner, and theme are all displayed consistently.

**Acceptance Scenarios**:

1. **Given** a store owner has saved store settings with a store name and banner, **When** they navigate to the POS screen, **Then** the store name and banner are shown in the page header.
2. **Given** a store owner has selected the "dark" theme preset, **When** they navigate to any dashboard screen, **Then** the theme colors match the "dark" preset.
3. **Given** a store owner has no banner uploaded, **When** they view any screen header, **Then** only the store name is displayed without a broken image or placeholder artifact.

---

### User Story 3 - Edit Store Settings (Priority: P2)

A store owner who has already completed onboarding can access a "Store Settings" page to update their store name, replace the banner/logo, or change the theme. Changes take effect immediately upon saving.

**Why this priority**: Important for ongoing store management, but secondary to the initial setup flow. The store can operate without editing settings after first setup.

**Independent Test**: Can be tested by navigating to Store Settings after onboarding, modifying each field, saving, and verifying updates are reflected on all screens.

**Acceptance Scenarios**:

1. **Given** a store owner has completed onboarding, **When** they navigate to the Store Settings page, **Then** their current store name, banner, and theme are pre-populated in the form.
2. **Given** a store owner is on the Store Settings page, **When** they change the store name and tap "Save", **Then** the updated name is shown in headers across all screens.
3. **Given** a store owner uploads a new banner image, **When** they save, **Then** the old banner is replaced and the new one is shown in headers.

---

### User Story 4 - Live Preview During Setup (Priority: P3)

While filling out the onboarding or settings form, the user sees a live preview of how their store header will look with the current store name, uploaded banner, and selected theme — before they commit by saving.

**Why this priority**: Enhances user experience and confidence but is not required for the core branding functionality to work. The feature is fully usable without it.

**Independent Test**: Can be tested by entering a store name, uploading a banner, and switching themes on the form — verifying the preview area updates in real time without saving.

**Acceptance Scenarios**:

1. **Given** a user is on the onboarding screen, **When** they type a store name, **Then** the preview area updates to show the entered name in real time.
2. **Given** a user is on the onboarding screen, **When** they select a different theme preset, **Then** the preview area updates to reflect the theme colors.
3. **Given** a user is on the onboarding screen, **When** they upload a banner image, **Then** the preview area shows the uploaded image.

---

### Edge Cases

- What happens when a user uploads a file that is not an image (e.g., a PDF)? The system rejects the upload with a clear error message indicating only image files are accepted.
- What happens when the uploaded image exceeds the maximum file size? The system rejects the upload and informs the user of the size limit.
- What happens if the banner upload fails mid-way (e.g., network issue)? The system shows an error and allows the user to retry without losing other form data (store name, theme selection are preserved).
- What happens when a user clears their store name in the settings and tries to save? Validation prevents saving with an empty store name.
- What happens if the user taps "Skip"? A default settings row is inserted so the system functions with defaults. They can configure branding later from the settings page.
- What happens when the storage service is unavailable? The form saves the store name and theme successfully, and shows an error for the banner upload only — other settings are not blocked.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST present the onboarding/store setup screen to users who have not yet configured store settings (no record exists for the authenticated user). The onboarding screen MUST include a skip/dismiss option that creates default settings and proceeds to the dashboard.
- **FR-002**: System MUST require a store name (non-empty text) before allowing the user to save settings.
- **FR-003**: System MUST allow the user to upload a banner/logo image (JPEG, PNG, or WebP formats) up to 2 MB in size. Files that are not valid images or exceed the size limit MUST be rejected with a clear error message before uploading.
- **FR-004**: System MUST store uploaded banner images in cloud storage and persist the resulting public URL alongside other settings.
- **FR-005**: System MUST provide at least three theme presets for selection (e.g., "light", "dark", "warm").
- **FR-006**: System MUST persist store settings (store name, banner URL, theme) to the database, associated with the authenticated user.
- **FR-007**: System MUST apply the saved store name and banner in the header/nav area of all dashboard screens (POS, Queue, Batch, Inventory, Reports).
- **FR-008**: System MUST apply the selected theme preset globally across all dashboard screens.
- **FR-009**: System MUST allow users who have completed onboarding to edit their store settings from a dedicated settings page.
- **FR-010**: System MUST load store settings once and cache them to avoid impacting page load performance on subsequent navigations.
- **FR-011**: System MUST default to the "light" theme when no theme has been selected.

### Key Entities

- **Store Settings**: Represents the branding configuration for a store. Key attributes: store name (required text), banner URL (optional image URL), theme preset (text, defaults to "light"). One record per authenticated user.
- **Theme Preset**: A named visual style (e.g., "light", "dark", "warm") that defines a set of colors applied globally. Not user-customizable beyond selection from the provided options.
- **Banner Image**: An image file uploaded by the user, stored externally and referenced by URL. Constrained to image types (JPEG, PNG, WebP) and a maximum file size of 2 MB.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: New users complete the store setup onboarding in under 2 minutes on their first login.
- **SC-002**: Store name and banner are visible on 100% of dashboard screens after setup is completed.
- **SC-003**: The `data-theme` attribute MUST be present in the server-rendered HTML response so no client-side re-paint is required for theme application.
- **SC-004**: Onboarding adds zero extra taps or latency to the core POS order flow after initial setup is complete.
- **SC-005**: Banner image uploads complete in under 5 seconds on a standard connection.
- **SC-006**: Store settings changes (name, banner, theme) are reflected across all screens immediately after saving, without requiring a manual page reload.

## Assumptions

- Only one store settings record exists per authenticated user (single-tenant, single-device model consistent with existing project conventions).
- The existing authentication system is reused; no new auth flows are needed for this feature.
- Cloud storage for file uploads is available and configured for the project.
- Theme presets are predefined and shipped with the app — users cannot create custom themes or define custom colors.
- The onboarding screen is shown only once; after saving, the user is not prompted again (they use the settings page for subsequent edits).
- Banner images do not need cropping, resizing, or advanced editing within the app — the user uploads a pre-prepared image.
- Mobile-first layout applies; the onboarding and settings screens must work well on tablet and phone form factors.
- The feature does not require real-time sync or multi-device coordination — settings are loaded per session.
