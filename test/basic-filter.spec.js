const { expect } = require('chai');
const chai = require('chai');
const sinon = require('sinon');
const { BasicFilter } = require('../src/io/filter');
const { ObjectReadableMock, ObjectWritableMock } = require('stream-mock');

chai.should();

describe('BasicFilter tests.', () => {
  it('Should filter by the word \'Lorem\'.', () => {
    const input = [Buffer.from('Lorem ipsum dolor sit amet.\n'),
      Buffer.from('Consectetur adipiscing elit.\n'), Buffer.from('Nam lacinia finibus viverra.\n')];

    const transform = new BasicFilter(10, 'Lorem ipsum');
    const reader = new ObjectReadableMock(input);
    const writer = new ObjectWritableMock();

    reader.pipe(transform).pipe(writer);

    writer.on('finish', () => {
      expect(writer.data.length).to.eq(1);
      expect(writer.data[0]).to.eq(input[0]);
    });
  });

  it('Should limit the number of results.', () => {
    const input = [Buffer.from('Lorem ipsum dolor sit amet.\n'),
      Buffer.from('Consectetur adipiscing elit.\n'), Buffer.from('Nam lacinia finibus viverra.\n')];

    const transform = new BasicFilter(2);
    const reader = new ObjectReadableMock(input);
    const writer = new ObjectWritableMock();

    reader.pipe(transform).pipe(writer);

    writer.on('finish', () => {
      expect(writer.data.length).to.eq(2);
      expect(writer.data[0]).to.eq(input[0]);
      expect(writer.data[1]).to.eq(input[1]);
    });
  });

  it('Should limit the number of results and filter results.', () => {
    const input = [Buffer.from('Lorem ipsum dolor sit amet.\n'),
      Buffer.from('Consectetur adipiscing elit.\n'), Buffer.from('Nam lacinia finibus viverra.\n')];

    const transform = new BasicFilter(1, 'finibus');
    const reader = new ObjectReadableMock(input);
    const writer = new ObjectWritableMock();

    reader.pipe(transform).pipe(writer);

    writer.on('finish', () => {
      expect(writer.data.length).to.eq(1);
      expect(writer.data[0]).to.eq(input[2]);
    });
  });
});
