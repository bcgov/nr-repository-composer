## How to contribute
Government employees, public and members of the private sector are encouraged to contribute to the repository by **forking and submitting a pull request**.

(If you are new to GitHub, you might start with a [basic tutorial](https://help.github.com/articles/set-up-git) and  check out a more detailed guide to [pull requests](https://help.github.com/articles/using-pull-requests/).)

Pull requests will be evaluated by the repository guardians on a schedule and if deemed beneficial will be committed to the main.

All contributors retain the original copyright to their stuff, but by contributing to this project, you grant a world-wide, royalty-free, perpetual, irrevocable, non-exclusive, transferable license to all users **under the terms of the license under which this project is distributed.**

## Development Patterns

### Timeout and Retry Handling

Generated workflows use curl with retry and timeout flags to handle transient failures. When modifying templates that make HTTP requests, follow these conventions:

#### Standard Curl Retry Pattern

**Quick Operations** (token checks, single API calls):
```bash
curl ... \
  --retry 2 \
  --retry-all-errors \
  --max-time 30 \
  --connect-timeout 10 \
  --retry-delay 5
```
- Use `--retry-all-errors` to retry on all error types (not just transient)
- Connection timeout should be 5-10 seconds (establishes TCP connection)
- Total timeout (`--max-time`) should be 30 seconds or less
- Retry delay is typically half of max-time or less

**Long-Running Polling** (broker/Jenkins status checks):
```bash
curl ... \
  --retry 1 \
  --retry-delay 1 \
  --max-time 15 \
  --connect-timeout 5
```
- Use `--retry 1` for polling loops (fewer retries, loop provides overall timeout)
- Shorter timeouts (15s max-time) keep polling responsive
- Connection timeout is shorter (5s) since broker is usually responsive
- Retry delay is minimal since loop sleeps between iterations

#### Exit Code Handling

Always capture and handle curl exit codes, especially exit code 28 (timeout):

```bash
curl ... > /dev/null 2>&1
CURL_EXIT_CODE=$?

if [ "$CURL_EXIT_CODE" -eq 28 ]; then
  echo "Error: Request timed out (curl exit code 28)."
  # Handle timeout (may be distinct from failure)
elif [ "$CURL_EXIT_CODE" -ne 0 ]; then
  echo "Error: Request failed (curl exit code $CURL_EXIT_CODE)."
  # Handle other errors
fi
```

#### Timeout vs. Failure

Distinguish timeouts from failures in error messages:
- **Timeout** (curl exit 28): Usually recoverable; network is reachable but slow
- **Failure** (curl exits 1-27, 29+): Actual error; connection refused, DNS failure, etc.

Polling loops should treat timeouts distinctly from job completion failures. A timeout waiting for broker/Jenkins doesn't mean the job failed—it may still be running.

