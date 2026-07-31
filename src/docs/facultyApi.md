# KRMU Backend API Documentation

## Faculty APIs

Base URL:

`http://localhost:3000`

### Faculty Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/faculty` | Get all active faculty |
| GET | `/faculty?page=1&limit=10` | Get paginated faculty |
| GET | `/faculty?search=rahul` | Search faculty |
| GET | `/faculty?status=published` | Get published faculty |
| GET | `/faculty?status=draft` | Get draft faculty |
| GET | `/faculty?page=1&limit=10&search=rahul` | Search with pagination |
| GET | `/faculty?page=1&limit=10&status=published` | Published faculty with pagination |
| GET | `/faculty?page=1&limit=10&status=draft` | Draft faculty with pagination |
| GET | `/faculty?page=1&limit=10&status=published&search=rahul` | Filter, search and paginate faculty |
| POST | `/faculty` | Create new faculty |
| PATCH | `/faculty/:id` | Update faculty |
| PATCH | `/faculty/:id/publish` | Publish faculty |
| PATCH | `/faculty/:id/draft` | Move faculty to draft |
| DELETE | `/faculty/:id` | Soft delete / move to trash |
| GET | `/faculty/trash` | Get trashed faculty |
| PATCH | `/faculty/:id/restore` | Restore faculty from trash |
| DELETE | `/faculty/:id/permanent-delete` | Permanently delete faculty |

---

## Query Parameters

The faculty listing endpoint supports the following optional query parameters:

| Parameter | Type | Example | Description |
|---|---|---|---|
| `page` | number | `1` | Current page number |
| `limit` | number | `10` | Number of records per page |
| `search` | string | `rahul` | Search faculty |
| `status` | string | `published` | Filter by `published` or `draft` |

All query parameters are optional.

Default values:

- `page = 1`
- `limit = 10`
- `search = ''`
- `status = undefined`

---

## Examples

### Get Faculty

`GET /faculty`

### Pagination

`GET /faculty?page=1&limit=10`

### Search

`GET /faculty?search=rahul`

### Search With Pagination

`GET /faculty?page=1&limit=10&search=rahul`

### Published Faculty

`GET /faculty?status=published`

### Draft Faculty

`GET /faculty?status=draft`

### Published Faculty With Pagination

`GET /faculty?page=1&limit=10&status=published`

### Draft Faculty With Pagination

`GET /faculty?page=1&limit=10&status=draft`

### Search Published Faculty

`GET /faculty?page=1&limit=10&status=published&search=rahul`

### Search Draft Faculty

`GET /faculty?page=1&limit=10&status=draft&search=rahul`

### Create Faculty

`POST /faculty`

### Update Faculty

`PATCH /faculty/412`

### Publish Faculty

`PATCH /faculty/412/publish`

### Move Faculty To Draft

`PATCH /faculty/412/draft`

### Move Faculty To Trash

`DELETE /faculty/412`

### Get Trash

`GET /faculty/trash`

### Restore Faculty

`PATCH /faculty/412/restore`

### Permanent Delete

`DELETE /faculty/412/permanent-delete`

---

## Faculty Status

Faculty records can have the following statuses:

| Status | Description |
|---|---|
| `published` | Faculty is published |
| `draft` | Faculty is saved but not published |
| Trash | Faculty has `deleted_at` set |

### Active Faculty

`deleted_at IS NULL`

### Published Faculty

`status = 'published' AND deleted_at IS NULL`

### Draft Faculty

`status = 'draft' AND deleted_at IS NULL`

### Trashed Faculty

`deleted_at IS NOT NULL`

---

## Faculty Lifecycle

Draft:

`POST /faculty`

↓

Publish:

`PATCH /faculty/:id/publish`

↓

Published

↓

Move back to Draft:

`PATCH /faculty/:id/draft`

↓

Move to Trash:

`DELETE /faculty/:id`

↓

Restore:

`PATCH /faculty/:id/restore`

OR

Permanent Delete:

`DELETE /faculty/:id/permanent-delete`