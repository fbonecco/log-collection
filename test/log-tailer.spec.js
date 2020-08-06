const mockFs = require('mock-fs');
const { expect } = require('chai');
const chai = require('chai');
const sinon = require('sinon');
const fsp = require('fs').promises;
const { LogTailer } = require('../src/io/log-tailer');

chai.should();

mockFs({
  '/var/log': {
    'test-1.log': 'AAA\nBBB\nCCC\nDDD\nEEE\nFFF\nGGG\nHHH\nIII\nJJJ',
  },
});

const explodedEvents = ['JJJ\n', 'III\n', 'HHH\n', 'GGG\n', 'FFF\n', 'EEE\n', 'DDD\n', 'CCC\n', 'BBB\n', 'AAA\n'];

describe('LogTailer tests.', () => {
  describe('Reading last N events, over a set of 10 events.', () => {
    describe('Read 5 events.', () => {
      it('Should return the last 5 events, in reversed order.', async () => {
        const logger = new LogTailer('/var/log/test-1.log', 5);

        const buffer = [];
        logger.on('data', (chunk) => {
          buffer.push(chunk.toString('utf8'));
        });

        await logger.read();

        const expectedOutput = explodedEvents.slice(0, 5).join('');
        expect(buffer.join('')).to.eq(expectedOutput);
      });
    });

    describe('Read 100 events.', () => {
      it(`Should return all the events,
        even if N is bigger than the total number of events.`, async () => {
        const logger = new LogTailer('/var/log/test-1.log', 100);

        const buffer = [];
        logger.on('data', (chunk) => {
          buffer.push(chunk.toString('utf8'));
        });

        await logger.read();

        const expectedOutput = explodedEvents.slice(0, 10).join('');
        expect(buffer.join('')).to.eq(expectedOutput);
      });
    });

    describe('Validations.', () => {
      beforeEach(() => {
        sinon.spy(fsp, 'open');
      });

      afterEach(() => {
        sinon.restore();
      });

      describe('Empty path.', () => {
        it('Should throw error when path is empty or invalid.', async () => {
          expect(() => {
            const logger = new LogTailer('', 10);
          }).to.throw('The "path" argument can\' be empty.');

          expect(() => {
            const logger = new LogTailer(888, 10);
          }).to.throw('The "path" argument must be of type string.');

          fsp.open.called.should.be.false;
        });
      });

      describe('.', () => {
        it('Should throw error when path is invalid.', async () => {
          expect(() => {
            const logger = new LogTailer('', 10);
          }).to.throw('The "path" argument can\' be empty.');
          fsp.open.called.should.be.false;
        });
      });

      describe('Read 0 events.', () => {
        it('Should throw error when numberOfLines is < 1.', async () => {
          expect(() => {
            const logger = new LogTailer('/var/log/test-1.log', 0);
          }).to.throw('The "numberOfLines" argument value must be greater than 0.');

          fsp.open.called.should.be.false;
        });
      });

      describe('Invalid buffer size.', () => {
        it('Should throw error when bufferSize is invalid.', async () => {

          expect(() => {
            const bufferSize = 0;
            const logger = new LogTailer('/var/log/test-1.log', 4, {'bufferSize': bufferSize});
          }).to.throw('The "bufferSize" argument value must be between 0 and 16384.');

          fsp.open.called.should.be.false;
        });
      });
    });

    describe('Testing specific behaviours.', () => {
      beforeEach(function() {
        sinon.spy(fsp, 'open');
      });

      afterEach(function() {
        sinon.restore();
      });

      describe('Set a buffer of size 8 bytes (each line is 4 bytes).', () => {
        it('Should read events in chunks of 4 bytes.', async () => {
            const bufferSize = 8;
            const logger = new LogTailer('/var/log/test-1.log', 4, {'bufferSize': bufferSize});

            const buffer = [];
            logger.on('data', (chunk) => {
              buffer.push(chunk.toString('utf8'));
            });

            await logger.read();
            await logger.read();


            expect(buffer.length).to.eq(2);
            expect(buffer[0].length).to.eq(bufferSize);
            expect(buffer[1].length).to.eq(bufferSize);
            const expectedOutput = explodedEvents.slice(0, 4).join('');
            expect(expectedOutput).to.eq(buffer.join(''));
        });
      });

      describe('Validate file is properly close upon success.', () => {
        it('Should close the file after every interaction.', async () => {
          const bufferSize = 8;
          const logger = new LogTailer('/var/log/test-1.log', 4, {'bufferSize': bufferSize});;

          sinon.spy(logger, 'closeFile');

          await logger.read();
          await logger.read();

          // TODO: Need to mock fsp to validate resources are properly closed
          fsp.open.calledTwice.should.be.true;
        });
      });

      describe('Validate events.', () => {
        it('Should trigger the data event when emitting values.', async () => {
          const bufferSize = 8;
          const logger = new LogTailer('/var/log/test-1.log', 4, {'bufferSize': bufferSize});;

          const spy = sinon.spy(logger, 'emit');

          await logger.read();
          await logger.read();

          expect(spy.callCount).to.eq(3);

          let expectedData = explodedEvents.slice(0, 2).join('');
          let [eventType, data] = spy.getCall(0).args;
          expect(eventType).to.eq('data');
          expect(data.toString('utf8')).to.eq(expectedData);

          expectedData = explodedEvents.slice(2, 4).join('');
          [eventType, data] = spy.getCall(1).args;
          expect(eventType).to.eq('data');
          expect(data.toString('utf8')).to.eq(expectedData);

          [eventType, data] = spy.getCall(2).args;
          expect(eventType).to.eq('end');

        });
      });


    });
  });
});
