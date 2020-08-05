const { expect } = require('chai');
const chai = require('chai');
const sinon = require('sinon');
const { BasicTextFilter } = require('../src/basic-text-filter');
const { ObjectReadableMock, ObjectWritableMock } = require('stream-mock');

chai.should();

describe('BasicTextFilter tests.', () => {
  it('Should filter by the word \'Lorem\'.', () => {
    const input = ['Lorem ipsum dolor sit amet.\n', 'Consectetur adipiscing elit.\n', 'Nam lacinia finibus viverra.\n'];

    const transform = new BasicTextFilter('Lorem ipsum');
    const reader = new ObjectReadableMock(input);
    const writer = new ObjectWritableMock();

    reader.pipe(transform).pipe(writer);

    writer.on('finish', () => {
      expect(writer.data.length).to.eq(1);
      expect(writer.data[0].toString()).to.eq(input[0]);
    });
  });
});
