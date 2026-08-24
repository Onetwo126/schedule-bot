import test from "node:test";
import assert from "node:assert/strict";

import {
    isStaffCell,
    normalizeStaffLogin,
    staffCellContainsLogin,
} from "../src/utils/staff-login.util.js";

test("normalizes a login entered with or without @", () => {
    assert.equal(normalizeStaffLogin(" @MurinaNastya "), "murinanastya");
});

test("finds the same employee in old and new sheet headers", () => {
    assert.equal(
        staffCellContainsLogin("Настя М (@murinanastya)", "murinanastya"),
        true
    );
    assert.equal(
        staffCellContainsLogin("Настя ( murinanastya )", "@MurinaNastya"),
        true
    );
});

test("does not accept another login that only contains the requested login", () => {
    assert.equal(
        staffCellContainsLogin("Настя (@murinanastya2)", "murinanastya"),
        false
    );
    assert.equal(
        staffCellContainsLogin("Настя (other-murinanastya)", "murinanastya"),
        false
    );
});

test("recognizes staff markers without treating activities as staff", () => {
    assert.equal(isStaffCell("Настя М (@murinanastya)"), true);
    assert.equal(isStaffCell("Настя ( murinanastya )"), true);
    assert.equal(isStaffCell("angry (личка)"), false);
});
