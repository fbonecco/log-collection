const mockFs = require('mock-fs');
const { expect } = require('chai');
const chai = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const { LogStream } = require('../src/io/log-stream');
const { ObjectReadableMock, ObjectWritableMock } = require('stream-mock');

chai.should();

mockFs({
  '/var/log': {
    'test-1.log': 'AAA\nBBB\nCCC\nDDD\nEEE\nFFF\nGGG\nHHH\nIII\nJJJ\n',
    'test-2.log': 'JJJ\n',
    'test-3.log': '',
    'test-4.log': '\n\nABC\n\n\nD\nE\n',
  },
});


describe('LogStream tests.', () => {
  describe('Streaming events.', () => {
    it('Read 1 - Should return all the lines.', () => {
      const expectedEvents = ['JJJ\n', 'III\n', 'HHH\n', 'GGG\n', 'FFF\n', 'EEE\n', 'DDD\n', 'CCC\n', 'BBB\n', 'AAA\n'];
      const logStream = new LogStream('/var/log/test-1.log');
      const writer = new ObjectWritableMock();
      writer.on('finish', () => {
        expect(writer.data).to.eql(expectedEvents);
      });
      logStream.pipe(writer);
      logStream.read();
    });

    it('Read 2 - Should return all the lines.', () => {
      const expectedEvents = ['JJJ\n'];
      const logStream = new LogStream('/var/log/test-2.log');
      const writer = new ObjectWritableMock();
      writer.on('finish', () => {
        expect(writer.data).to.eql(expectedEvents);
      });
      logStream.pipe(writer);
      logStream.read();
    });

    it('Read 3 - Should return all the lines.', () => {
      const logStream = new LogStream('/var/log/test-3.log');
      const writer = new ObjectWritableMock();
      writer.on('finish', () => {
        expect(writer.data.length).to.eq(0);
      });
      logStream.pipe(writer);
      logStream.read();
    });

    it('Read 4 - Should return all the lines.', () => {
      const expectedEvents = ['E\n', 'D\n', '\n', '\n', 'ABC\n', '\n', '\n'];
      const logStream = new LogStream('/var/log/test-4.log');
      const writer = new ObjectWritableMock();
      writer.on('finish', () => {
        expect(writer.data).to.eql(expectedEvents);
      });
      logStream.pipe(writer);
      logStream.read();
    });

    describe('Validations.', () => {
      beforeEach(() => {
        sinon.spy(fs, 'open');
        sinon.spy(fs, 'fstat');
      });

      afterEach(() => {
        sinon.restore();
      });

      describe('Empty path.', () => {
        it('Should throw error when path is empty or invalid.', () => {
          expect(() => {
            const logStream = new LogStream('');
          }).to.throw('The "path" argument can\' be empty.');

          expect(() => {
            const logStream = new LogStream(888);
          }).to.throw('The "path" argument must be of type string.');

          fs.open.called.should.be.false;
          fs.fstat.called.should.be.false;
        });
      });

      describe('.', () => {
        it('Should throw error when path is invalid.', () => {
          expect(() => {
            const logStream = new LogStream('');
          }).to.throw('The "path" argument can\' be empty.');

          fs.open.called.should.be.false;
          fs.fstat.called.should.be.false;
        });
      });

      describe('Invalid buffer size.', () => {
        it('Should throw error when bufferSize is invalid.', () => {

          expect(() => {
            const bufferSize = 0;
            const logStream = new LogStream('/var/log/test-1.log', {'bufferSize': bufferSize});
          }).to.throw('The "bufferSize" argument value must be between 65536 and 10485760.');

          fs.open.called.should.be.false;
          fs.fstat.called.should.be.false;
        });
      });
    });


    describe('Testing specific behaviours.', () => {
      beforeEach(function() {
        sinon.spy(fs, 'open');
        sinon.spy(fs, 'close');
      });

      afterEach(function() {
        sinon.restore();
      });

      describe('Validate file is properly close upon success.', () => {
        it('Should close the file once the is no more data..', () => {
          const logStream = new LogStream('/var/log/test-4.log');
          const writer = new ObjectWritableMock();

          logStream.on('close', () => {
            // TODO: Need to mock fsp to validate resources are properly closed
            fs.close.calledOnce.should.be.true;
          });

          logStream.pipe(writer);
          logStream.read();
        });
      });
    });
  });
});
