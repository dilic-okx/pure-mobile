import React from 'react';

import { arePathsEqual } from '../lib/arePathsEqual';
import { camelize } from '../lib/String';
const evtNames = ['click', 'mouseout', 'mouseover'];

const wrappedPromise = function() {
    var wrappedPromise = {},
        promise = new Promise(function (resolve, reject) {
            wrappedPromise.resolve = resolve;
            wrappedPromise.reject = reject;
        });
    wrappedPromise.then = promise.then.bind(promise);
    wrappedPromise.catch = promise.catch.bind(promise);
    wrappedPromise.promise = promise;

    return wrappedPromise;
}

export class Polygon extends React.Component {
  componentDidMount() {
    this.polygonPromise = wrappedPromise();
    this.renderPolygon();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.map !== prevProps.map ||
      !arePathsEqual(this.props.paths, prevProps.paths)
    ) {
      if (this.polygon) {
        this.polygon.setMap(null);
      }
      this.renderPolygon();
    }
  }

  componentWillUnmount() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }
  }

  renderPolygon() {
    const {
      map,
      google,
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      ...props
    } = this.props;

    if (!google) {
        return null;
    }

    const params = {
      map,
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      ...props
    };

    this.polygon = new google.maps.Polygon(params);

    evtNames.forEach(e => {
      this.polygon.addListener(e, this.handleEvent(e));
    });

    this.polygonPromise.resolve(this.polygon);
  }

  getPolygon() {
    return this.polygonPromise;
  }

  handleEvent(evt) {
    return (e) => {
      const evtName = `on${camelize(evt)}`
      if (this.props[evtName]) {
        this.props[evtName](this.props, this.polygon, e);
      }
    }
  }

  render() {
    return null;
  }
}

Polygon.defaultProps = {
  name: 'Polygon'
}

export default Polygon
