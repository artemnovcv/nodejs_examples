/**
 * Test.js is used for checking functionalities for the program.
 * Used for representing test-driven development, where every test case
 * expresses specified requirements and show what result should be expected from the specified use-case.
 * Supertest and mocha were used for implementing mentioned technique.
 * @type {*|(function(): obj)}
 */
var supertest = require('supertest');
var server = supertest.agent("http://localhost:3000");


describe("Teacher test", function () {

    it("should return all the teachers", function (done) {
        server.get('/api/teacher/')
            .expect('Content-type', 'application/json; charset=utf-8')
            .expect(200, done);
    });

    it("should assign a teacher to a course", function (done) {
        server.post("/api/teacher/ABC123/AC")
            .expect(201, done);
    });

    it("deletes specific course assigned to a teacher", function (done) {
        server.delete("/api/teacher/ABC123/AC")
            .expect(200, done);
    });

});

describe("Course test", function () {

    it("should return all the courses", function (done) {
        server.get('/api/course/')
            .expect('Content-type', 'application/json; charset=utf-8')
            .expect(200, done);
    });

    it("should return all the courses taught by a specific teacher", function (done) {
       server.get('/api/course/ABC1234')
           .expect('Content-type', 'application/json; charset=utf-8')
           .expect(200, done);
    });

});
